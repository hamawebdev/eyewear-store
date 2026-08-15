import type { Payload } from "payload";
import type { PayloadRequest, Where } from "payload";
import { normalizeDocumentId } from "@/lib/document-id";
import type {
  AdminOrderActionPayload,
  CreateOrderInput,
  CourierImportRequest,
  OrderLookupResult,
  OrderSummary
} from "@/lib/orders/schemas";
import {
  AdminOrderActionPayloadSchema,
  CourierImportRequestSchema,
  OrderLookupResultSchema,
  OrderSummarySchema
} from "@/lib/orders/schemas";
import type {
  PayloadCourierSyncRunDocument,
  PayloadOrderDocument,
  PayloadOrderEventDocument,
  PayloadProductDocument,
  PayloadProductOptionRow,
  PayloadShippingProviderDocument
} from "@/lib/payload/types";
import { getPayloadClient } from "@/lib/payload/server";
import { findWilayaByLocalizedName } from "@/lib/wilaya-lookup";
import type { CourierUpdate } from "@/lib/shipping/types";
import {
  buildTrackingUrl,
  fromMinorUnits,
  getCurrency,
  normalizeExchangeStatus,
  normalizePhoneNumber,
  toMinorUnits
} from "./utils";
import { appendOrderEvent, SKIP_ORDER_EVENT_HOOK_CONTEXT_KEY } from "./events";
import { formatOrderRef } from "./server-utils";
import { getCourierAdapter } from "@/lib/shipping/registry";

type AdminOrderActionInput = AdminOrderActionPayload;

const ORDER_COLLECTION = "orders";
const ORDER_EVENTS_COLLECTION = "order-events";
const SHIPPING_PROVIDER_COLLECTION = "shipping-providers";
const COURIER_SYNC_RUNS_COLLECTION = "courier-sync-runs";

const TERMINAL_LIFECYCLE_STATUSES = new Set<PayloadOrderDocument["lifecycleStatus"]>([
  "cancelled",
  "delivered",
  "returned"
]);

const DELIVERY_STATUS_TRANSITIONS: Record<
  PayloadOrderDocument["lifecycleStatus"],
  PayloadOrderDocument["lifecycleStatus"][]
> = {
  cancelled: [],
  confirmed: ["preparing", "submitted_to_courier", "cancelled"],
  delivered: [],
  delivery_failed: ["in_transit", "returned", "cancelled"],
  in_transit: ["delivered", "delivery_failed", "returned"],
  new: ["confirmed", "cancelled"],
  preparing: ["submitted_to_courier", "cancelled"],
  returned: [],
  submitted_to_courier: ["in_transit", "delivery_failed", "returned", "cancelled"]
};

const EXCHANGE_STATUS_TRANSITIONS: Record<
  PayloadOrderDocument["exchangeStatus"],
  PayloadOrderDocument["exchangeStatus"][]
> = {
  approved: ["shipped", "declined"],
  completed: [],
  declined: [],
  none: ["requested"],
  requested: ["approved", "declined", "none"],
  shipped: ["completed"]
};

const assertOrderIsMutable = ({
  message,
  order
}: {
  message: string;
  order: PayloadOrderDocument;
}) => {
  if (TERMINAL_LIFECYCLE_STATUSES.has(order.lifecycleStatus)) {
    throw new Error(message);
  }
};

const assertLifecycleTransitionAllowed = ({
  nextStatus,
  order
}: {
  nextStatus: PayloadOrderDocument["lifecycleStatus"];
  order: PayloadOrderDocument;
}) => {
  if (nextStatus === order.lifecycleStatus) {
    return;
  }

  const allowedStatuses = DELIVERY_STATUS_TRANSITIONS[order.lifecycleStatus] ?? [];

  if (!allowedStatuses.includes(nextStatus)) {
    throw new Error(`Cannot move an order from "${order.lifecycleStatus}" to "${nextStatus}".`);
  }
};

const assertExchangeTransitionAllowed = ({
  nextStatus,
  order
}: {
  nextStatus: PayloadOrderDocument["exchangeStatus"];
  order: PayloadOrderDocument;
}) => {
  if (nextStatus === order.exchangeStatus) {
    return;
  }

  const allowedStatuses = EXCHANGE_STATUS_TRANSITIONS[order.exchangeStatus] ?? [];

  if (!allowedStatuses.includes(nextStatus)) {
    throw new Error(
      `Cannot move exchange status from "${order.exchangeStatus}" to "${nextStatus}".`
    );
  }
};

const getProductOption = ({
  optionId,
  product
}: {
  optionId?: string;
  product: PayloadProductDocument;
}) => {
  if (!optionId || !Array.isArray(product.options)) {
    return null;
  }

  return (
    product.options.find(
      (option): option is PayloadProductOptionRow =>
        typeof option?.id === "string" && option.id === optionId
    ) ?? null
  );
};

const getCourierDocument = async ({ payload, slug }: { payload: Payload; slug: string }) => {
  const result = await payload.find({
    collection: SHIPPING_PROVIDER_COLLECTION,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: slug
      }
    }
  });

  return (result.docs as PayloadShippingProviderDocument[])[0] ?? null;
};

const resolveOrderSummary = (order: PayloadOrderDocument): OrderSummary =>
  OrderSummarySchema.parse({
    confirmationStatus: order.confirmationStatus,
    createdAt: order.createdAt,
    currency: order.currency || getCurrency(),
    deliveryMode: order.deliveryMode,
    exchangeStatus: order.exchangeStatus,
    itemCount: Array.isArray(order.items)
      ? order.items.reduce((total, item) => total + Number(item.quantity ?? 0), 0)
      : 0,
    lifecycleStatus: order.lifecycleStatus,
    orderRef: order.orderRef,
    paymentStatus: order.paymentStatus,
    totalMinor: order.totalMinor,
    trackingNumber: order.trackingNumber ?? undefined
  });

const buildUniqueOrderRef = async (payload: Payload) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderRef = formatOrderRef();
    const existing = await payload.find({
      collection: ORDER_COLLECTION,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        orderRef: {
          equals: orderRef
        }
      }
    });

    if (existing.docs.length === 0) {
      return orderRef;
    }
  }

  throw new Error("Unable to generate a unique order reference.");
};

const getPayloadAndReq = async (req?: PayloadRequest) => {
  const payload = await getPayloadClient();

  return {
    payload,
    req
  };
};

const buildOrderItems = async ({
  items,
  payload
}: {
  items: CreateOrderInput["items"];
  payload: Payload;
}) => {
  const snapshots: NonNullable<PayloadOrderDocument["items"]> = [];
  let declaredValueMinor = 0;
  let fragile = false;
  let insuranceEnabled = false;
  let stockType: string | undefined;
  let totalWeightGrams = 0;

  for (const item of items) {
    const product = (await payload.findByID({
      collection: "products",
      depth: 0,
      id: normalizeDocumentId(item.productId),
      overrideAccess: true
    })) as PayloadProductDocument;

    const option = getProductOption({
      optionId: item.optionId,
      product
    });
    const unitPrice = option?.price ?? product.displayPrice;

    if (typeof unitPrice !== "number") {
      throw new Error(`Product "${product.name}" does not have a valid price.`);
    }

    if (item.optionId && !option) {
      throw new Error(`Selected option is no longer available for "${product.name}".`);
    }

    const unitPriceMinor = toMinorUnits(unitPrice);
    const weightGrams =
      typeof product.defaultWeightGrams === "number" ? product.defaultWeightGrams : undefined;
    const originalUnitPriceMinor =
      typeof option?.originalPrice === "number"
        ? toMinorUnits(option.originalPrice)
        : typeof product.displayOriginalPrice === "number"
          ? toMinorUnits(product.displayOriginalPrice)
          : undefined;

    snapshots.push({
      image:
        typeof product.primaryImage === "object" && product.primaryImage?.url
          ? product.primaryImage.url
          : "/placeholder.svg",
      lineTotalMinor: unitPriceMinor * item.quantity,
      optionId: option?.id,
      optionLabel: option?.label?.trim() || undefined,
      originalUnitPriceMinor,
      productId: String(product.id),
      productName: product.name,
      productSlug: product.slug,
      quantity: item.quantity,
      stockType: product.defaultStockType?.trim() || undefined,
      unitPriceMinor,
      weightGrams
    });

    totalWeightGrams += (weightGrams ?? 0) * item.quantity;
    declaredValueMinor +=
      typeof product.defaultDeclaredValue === "number"
        ? toMinorUnits(product.defaultDeclaredValue) * item.quantity
        : unitPriceMinor * item.quantity;
    fragile ||= Boolean(product.defaultFragile);
    insuranceEnabled ||= Boolean(product.defaultInsuranceEnabled);
    stockType ||= product.defaultStockType?.trim() || undefined;
  }

  return {
    declaredValueMinor,
    fragile,
    insuranceEnabled,
    snapshots,
    stockType,
    totalWeightGrams
  };
};

const mapPublicEvents = (events: PayloadOrderEventDocument[]) =>
  events
    .filter((event) => event.isPublic && event.publicMessage)
    .map((event) => ({
      createdAt: event.createdAt,
      eventType: event.eventType,
      message: event.publicMessage as string
    }));

const getOrderEvents = async ({
  orderId,
  payload
}: {
  orderId: number | string;
  payload: Payload;
}) => {
  const result = await payload.find({
    collection: ORDER_EVENTS_COLLECTION,
    overrideAccess: true,
    pagination: false,
    sort: "createdAt",
    where: {
      order: {
        equals: orderId
      }
    }
  });

  return result.docs as PayloadOrderEventDocument[];
};

const findOrderBySubmissionKey = async ({
  payload,
  submissionKey
}: {
  payload: Payload;
  submissionKey: string;
}) => {
  const result = await payload.find({
    collection: ORDER_COLLECTION,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      submissionKey: {
        equals: submissionKey
      }
    }
  });

  return (result.docs as PayloadOrderDocument[])[0] ?? null;
};

const buildCourierAssignmentData = ({
  order,
  provider
}: {
  order: PayloadOrderDocument;
  provider?: PayloadShippingProviderDocument | null;
}) => ({
  provider: provider?.title ?? undefined,
  trackingNumber: order.trackingNumber ?? undefined,
  trackingURL:
    order.trackingURL ??
    buildTrackingUrl({
      template: provider?.trackingURLTemplate,
      trackingNumber: order.trackingNumber
    })
});

export const createStorefrontOrder = async ({
  input,
  req
}: {
  input: CreateOrderInput;
  req?: PayloadRequest;
}) => {
  const { payload } = await getPayloadAndReq(req);
  const existingOrder = await findOrderBySubmissionKey({
    payload,
    submissionKey: input.submissionKey
  });

  if (existingOrder) {
    return {
      order: existingOrder,
      summary: resolveOrderSummary(existingOrder)
    };
  }

  const orderItems = await buildOrderItems({
    items: input.items,
    payload
  });
  const itemSnapshots = orderItems.snapshots;

  if (itemSnapshots.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const subtotalMinor = itemSnapshots.reduce(
    (total, item) => total + Number(item.lineTotalMinor ?? 0),
    0
  );
  const selectedWilaya = await findWilayaByLocalizedName({
    name: input.wilaya,
    payload
  });

  if (!selectedWilaya) {
    throw new Error(`The selected wilaya "${input.wilaya}" is not recognized.`);
  }

  const deliveryPriceMajor =
    input.shippingMethod === "office"
      ? Number(selectedWilaya.officeDeliveryPrice)
      : Number(selectedWilaya.homeDeliveryPrice);

  const deliveryPriceMinor = toMinorUnits(deliveryPriceMajor);
  const totalMinor = subtotalMinor + deliveryPriceMinor;
  const orderRef = await buildUniqueOrderRef(payload);
  const phoneNormalized = normalizePhoneNumber(input.phoneNumber);
  const canonicalWilayaName = (selectedWilaya.name as string) || input.wilaya;
  const resolvedCommune = input.commune?.trim() || canonicalWilayaName;

  if (!phoneNormalized) {
    throw new Error("Please provide a valid phone number.");
  }

  const order = (await payload.create({
    collection: ORDER_COLLECTION,
    context: {
      ...(req?.context ?? {}),
      [SKIP_ORDER_EVENT_HOOK_CONTEXT_KEY]: true
    },
    data: {
      confirmationStatus: "pending",
      currency: getCurrency(),
      customerFullName: input.fullName.trim(),
      customerPhone: input.phoneNumber.trim(),
      declaredValueMinor: orderItems.declaredValueMinor,
      deliveryAddress: input.address?.trim() || undefined,
      deliveryCommune: resolvedCommune,
      deliveryMode: input.shippingMethod,
      deliveryNote: input.note?.trim() || undefined,
      deliveryPriceMinor,
      deliveryStation: input.station?.trim() || undefined,
      deliveryWilaya: canonicalWilayaName,
      deliveryWilayaCode: selectedWilaya.code as string,
      exchangeStatus: "none",
      fragile: orderItems.fragile,
      insuranceEnabled: orderItems.insuranceEnabled || orderItems.declaredValueMinor > 0,
      items: itemSnapshots,
      lifecycleStatus: "new",
      orderRef,
      parcelHeightCm: 10,
      parcelLengthCm: 10,
      parcelWeightKg:
        orderItems.totalWeightGrams > 0
          ? Number((orderItems.totalWeightGrams / 1000).toFixed(2))
          : undefined,
      parcelWidthCm: 10,
      paymentStatus: "pending_cod",
      phoneNormalized,
      source: "storefront",
      stockType: orderItems.stockType,
      submissionKey: input.submissionKey,
      subtotalMinor,
      totalMinor
    },
    overrideAccess: true,
    req
  })) as PayloadOrderDocument;

  await appendOrderEvent({
    actorType: "customer",
    eventType: "created",
    internalMessage: "Order created from storefront checkout.",
    isPublic: true,
    order: order.id,
    payload,
    publicMessage: "Order received and awaiting confirmation.",
    req
  });

  return {
    order,
    summary: resolveOrderSummary(order)
  };
};

export const getOrderLookupResult = async ({
  orderRef,
  phone,
  req
}: {
  orderRef: string;
  phone: string;
  req?: PayloadRequest;
}) => {
  const { payload } = await getPayloadAndReq(req);
  const normalizedPhone = normalizePhoneNumber(phone);

  if (!normalizedPhone) {
    return null;
  }

  const result = await payload.find({
    collection: ORDER_COLLECTION,
    depth: 1,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          orderRef: {
            equals: orderRef.trim().toUpperCase()
          }
        },
        {
          phoneNormalized: {
            equals: normalizedPhone
          }
        }
      ]
    }
  });

  const order = (result.docs as PayloadOrderDocument[])[0];

  if (!order) {
    return null;
  }

  const events = await getOrderEvents({
    orderId: order.id,
    payload
  });
  const provider =
    order.assignedCourier && typeof order.assignedCourier === "object"
      ? (order.assignedCourier as PayloadShippingProviderDocument)
      : null;

  return OrderLookupResultSchema.parse({
    courier: buildCourierAssignmentData({
      order,
      provider
    }),
    customer: {
      fullName: order.customerFullName
    },
    events: mapPublicEvents(events),
    order: {
      ...resolveOrderSummary(order),
      deliveryDestination: {
        commune: order.deliveryCommune,
        wilaya: order.deliveryWilaya
      }
    }
  }) satisfies OrderLookupResult;
};

const createSyncRun = async ({
  mapperVersion,
  mode,
  payload,
  providerId,
  req
}: {
  mapperVersion?: string;
  mode: "import" | "poll" | "webhook";
  payload: Payload;
  providerId?: number | string;
  req?: PayloadRequest;
}) =>
  (await payload.create({
    collection: COURIER_SYNC_RUNS_COLLECTION,
    context: {
      ...(req?.context ?? {}),
      [SKIP_ORDER_EVENT_HOOK_CONTEXT_KEY]: true
    },
    data: {
      mapperVersion,
      mode,
      processedCount: 0,
      provider: providerId,
      startedAt: new Date().toISOString(),
      status: "pending"
    },
    overrideAccess: true,
    req
  })) as PayloadCourierSyncRunDocument;

const completeSyncRun = async ({
  errorMessage,
  payload,
  processedCount,
  req,
  run,
  status
}: {
  errorMessage?: string;
  payload: Payload;
  processedCount: number;
  req?: PayloadRequest;
  run: PayloadCourierSyncRunDocument;
  status: "completed" | "failed";
}) =>
  payload.update({
    collection: COURIER_SYNC_RUNS_COLLECTION,
    context: {
      ...(req?.context ?? {}),
      [SKIP_ORDER_EVENT_HOOK_CONTEXT_KEY]: true
    },
    data: {
      completedAt: new Date().toISOString(),
      errorMessage,
      processedCount,
      status
    },
    id: run.id,
    overrideAccess: true,
    req
  });

const findOrderForCourierUpdate = async ({
  payload,
  providerOrderID,
  rawStatus,
  trackingNumber,
  orderRef
}: {
  orderRef?: string;
  payload: Payload;
  providerOrderID?: string;
  rawStatus?: string;
  trackingNumber?: string;
}) => {
  const or: Where[] = [];

  if (orderRef) {
    or.push({
      orderRef: {
        equals: orderRef
      }
    });
  }

  if (providerOrderID) {
    or.push({
      providerOrderID: {
        equals: providerOrderID
      }
    });
  }

  if (trackingNumber) {
    or.push({
      trackingNumber: {
        equals: trackingNumber
      }
    });
  }

  if (or.length === 0 && rawStatus) {
    return null;
  }

  if (or.length === 0) {
    return null;
  }

  const result = await payload.find({
    collection: ORDER_COLLECTION,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      or
    }
  });

  return (result.docs as PayloadOrderDocument[])[0] ?? null;
};

const syncCourierOrderStatus = async ({
  order,
  payload,
  req
}: {
  order: PayloadOrderDocument;
  payload: Payload;
  req?: PayloadRequest;
}) => {
  const provider =
    order.assignedCourier && typeof order.assignedCourier === "object"
      ? (order.assignedCourier as PayloadShippingProviderDocument)
      : null;

  if (!provider) {
    throw new Error("Assign a courier before syncing shipment status.");
  }

  if (!order.trackingNumber) {
    throw new Error("A tracking number is required before courier sync can run.");
  }

  const adapter = getCourierAdapter(provider);
  const run = await createSyncRun({
    mode: "poll",
    payload,
    providerId: provider.id,
    req
  });

  try {
    const update = await adapter.getShipment({
      order,
      trackingNumber: order.trackingNumber
    });
    const updated = await applyCourierUpdate({
      payload,
      provider,
      req,
      update
    });

    await completeSyncRun({
      payload,
      processedCount: 1,
      req,
      run,
      status: "completed"
    });

    return updated ?? order;
  } catch (error) {
    await completeSyncRun({
      errorMessage: error instanceof Error ? error.message : "Courier sync failed.",
      payload,
      processedCount: 0,
      req,
      run,
      status: "failed"
    });
    throw error;
  }
};

export const applyCourierUpdate = async ({
  payload,
  provider,
  req,
  update
}: {
  payload: Payload;
  provider?: PayloadShippingProviderDocument | null;
  req?: PayloadRequest;
  update: CourierUpdate;
}) => {
  const order = await findOrderForCourierUpdate({
    orderRef: update.orderRef,
    payload,
    providerOrderID: update.providerOrderID,
    rawStatus: update.rawStatus,
    trackingNumber: update.trackingNumber
  });

  if (!order) {
    return null;
  }

  const trackingNumber = update.trackingNumber ?? order.trackingNumber ?? undefined;
  const trackingURL =
    update.trackingURL ??
    buildTrackingUrl({
      template: provider?.trackingURLTemplate,
      trackingNumber
    }) ??
    order.trackingURL ??
    undefined;
  const nextLifecycleStatus =
    update.lifecycleStatus && update.lifecycleStatus !== order.lifecycleStatus
      ? update.lifecycleStatus
      : order.lifecycleStatus;
  const nextProviderId = provider?.id ?? order.assignedCourier;
  const nextProviderOrderId = update.providerOrderID ?? order.providerOrderID ?? undefined;
  const nextRawStatus = update.rawStatus ?? order.rawCourierStatus ?? undefined;
  const nextLabelURL = update.labelURL ?? order.labelURL ?? undefined;
  const nextRawPayload = update.rawPayload ?? order.rawCourierPayload ?? undefined;
  const hasMeaningfulChange =
    nextLifecycleStatus !== order.lifecycleStatus ||
    trackingNumber !== (order.trackingNumber ?? undefined) ||
    trackingURL !== (order.trackingURL ?? undefined) ||
    nextProviderOrderId !== (order.providerOrderID ?? undefined) ||
    nextRawStatus !== (order.rawCourierStatus ?? undefined) ||
    nextLabelURL !== (order.labelURL ?? undefined) ||
    nextProviderId !== order.assignedCourier ||
    Boolean(update.rawPayload);

  if (!hasMeaningfulChange) {
    return order;
  }

  const updatedOrder = (await payload.update({
    collection: ORDER_COLLECTION,
    context: {
      ...(req?.context ?? {}),
      [SKIP_ORDER_EVENT_HOOK_CONTEXT_KEY]: true
    },
    data: {
      assignedCourier: nextProviderId,
      labelURL: nextLabelURL,
      lifecycleStatus: nextLifecycleStatus,
      providerOrderID: nextProviderOrderId,
      rawCourierPayload: nextRawPayload,
      rawCourierStatus: nextRawStatus,
      syncedAt: new Date().toISOString(),
      trackingNumber,
      trackingURL
    },
    id: order.id,
    overrideAccess: true,
    req
  })) as PayloadOrderDocument;

  await appendOrderEvent({
    actorLabel: provider?.title,
    actorType: "courier",
    eventType: "courier_synced",
    internalMessage: `Courier sync updated status to "${updatedOrder.lifecycleStatus}".`,
    isPublic: true,
    order: updatedOrder.id,
    payload,
    publicMessage: `Shipping status updated: ${updatedOrder.lifecycleStatus.replace(/_/g, " ")}.`,
    req
  });

  return updatedOrder;
};

export const handleCourierWebhook = async ({
  body,
  providerSlug,
  req
}: {
  body: unknown;
  providerSlug: string;
  req?: PayloadRequest;
}) => {
  const { payload } = await getPayloadAndReq(req);
  const provider = await getCourierDocument({
    payload,
    slug: providerSlug
  });

  if (!provider) {
    throw new Error(`Unknown provider "${providerSlug}".`);
  }

  const adapter = getCourierAdapter(provider);
  const run = await createSyncRun({
    mode: "webhook",
    payload,
    providerId: provider.id,
    req
  });

  try {
    const updates = await adapter.parseWebhook(body);
    let processedCount = 0;

    for (const update of updates) {
      const result = await applyCourierUpdate({
        payload,
        provider,
        req,
        update
      });

      if (result) {
        processedCount += 1;
      }
    }

    await completeSyncRun({
      payload,
      processedCount,
      req,
      run,
      status: "completed"
    });

    return {
      processedCount
    };
  } catch (error) {
    await completeSyncRun({
      errorMessage: error instanceof Error ? error.message : "Webhook processing failed.",
      payload,
      processedCount: 0,
      req,
      run,
      status: "failed"
    });
    throw error;
  }
};

const normalizeImportedRow = (row: Record<string, unknown>) => ({
  exchangeStatus:
    normalizeExchangeStatus(
      typeof row["EXCHANGE STATUS"] === "string" ? row["EXCHANGE STATUS"] : undefined
    ) ?? undefined,
  orderRef:
    typeof row["ORDER ID"] === "string" && row["ORDER ID"].trim()
      ? row["ORDER ID"].trim().toUpperCase()
      : undefined,
  rawStatus:
    typeof row["RAW STATUS"] === "string" && row["RAW STATUS"].trim()
      ? row["RAW STATUS"].trim()
      : typeof row.STATUS === "string" && row.STATUS.trim()
        ? row.STATUS.trim()
        : undefined,
  trackingNumber:
    typeof row.TRACKING === "string" && row.TRACKING.trim() ? row.TRACKING.trim() : undefined
});

export const importCourierStatuses = async ({
  input,
  req
}: {
  input: CourierImportRequest;
  req?: PayloadRequest;
}) => {
  const parsedInput = CourierImportRequestSchema.parse(input);
  const { payload } = await getPayloadAndReq(req);
  const provider = await getCourierDocument({
    payload,
    slug: parsedInput.providerSlug
  });

  if (!provider) {
    throw new Error(`Unknown provider "${parsedInput.providerSlug}".`);
  }

  const adapter = getCourierAdapter(provider);
  const run = await createSyncRun({
    mapperVersion: parsedInput.mapperVersion,
    mode: "import",
    payload,
    providerId: provider.id,
    req
  });

  try {
    const updates = await adapter.importStatuses({
      mapperVersion: parsedInput.mapperVersion,
      rows: parsedInput.rows?.map(normalizeImportedRow) ?? [],
      sourceText: parsedInput.csvText
    });

    if (parsedInput.dryRun) {
      await completeSyncRun({
        payload,
        processedCount: updates.length,
        req,
        run,
        status: "completed"
      });

      return {
        dryRun: true,
        processedCount: updates.length
      };
    }

    let processedCount = 0;

    for (const update of updates) {
      const result = await applyCourierUpdate({
        payload,
        provider,
        req,
        update
      });

      if (result) {
        processedCount += 1;
      }
    }

    await completeSyncRun({
      payload,
      processedCount,
      req,
      run,
      status: "completed"
    });

    return {
      dryRun: parsedInput.dryRun,
      processedCount
    };
  } catch (error) {
    await completeSyncRun({
      errorMessage: error instanceof Error ? error.message : "Import failed.",
      payload,
      processedCount: 0,
      req,
      run,
      status: "failed"
    });
    throw error;
  }
};

export const performAdminOrderAction = async ({
  actionInput,
  orderId,
  req
}: {
  actionInput: AdminOrderActionInput;
  orderId: number | string;
  req?: PayloadRequest;
}) => {
  const input = AdminOrderActionPayloadSchema.parse(actionInput);
  const { payload } = await getPayloadAndReq(req);
  const order = (await payload.findByID({
    collection: ORDER_COLLECTION,
    depth: 1,
    id: normalizeDocumentId(orderId),
    overrideAccess: true
  })) as PayloadOrderDocument;

  if (!order) {
    throw new Error("Order not found.");
  }

  switch (input.action) {
    case "confirm": {
      if (order.confirmationStatus === "confirmed") {
        throw new Error("Order is already confirmed.");
      }

      if (order.confirmationStatus === "rejected") {
        throw new Error("Rejected orders cannot be confirmed.");
      }

      assertOrderIsMutable({
        message: "This order can no longer be confirmed.",
        order
      });

      if (!["new", "confirmed", "preparing"].includes(order.lifecycleStatus)) {
        throw new Error(`Cannot confirm an order while it is "${order.lifecycleStatus}".`);
      }

      const updated = (await payload.update({
        collection: ORDER_COLLECTION,
        context: {
          ...(req?.context ?? {}),
          [SKIP_ORDER_EVENT_HOOK_CONTEXT_KEY]: true
        },
        data: {
          confirmationStatus: "confirmed",
          lifecycleStatus: order.lifecycleStatus === "new" ? "confirmed" : order.lifecycleStatus
        },
        id: order.id,
        overrideAccess: true,
        req
      })) as PayloadOrderDocument;

      await appendOrderEvent({
        actorType: "admin",
        eventType: "confirmation_updated",
        internalMessage: "Order confirmed by admin.",
        isPublic: true,
        order: order.id,
        payload,
        publicMessage: "Order confirmed and queued for preparation.",
        req
      });

      return updated;
    }
    case "reject": {
      if (order.confirmationStatus === "rejected") {
        throw new Error("Order is already rejected.");
      }

      if (order.paymentStatus === "paid") {
        throw new Error("Paid orders cannot be rejected.");
      }

      assertOrderIsMutable({
        message: "This order can no longer be rejected.",
        order
      });

      if (!["new", "confirmed"].includes(order.lifecycleStatus)) {
        throw new Error(`Cannot reject an order while it is "${order.lifecycleStatus}".`);
      }

      const updated = (await payload.update({
        collection: ORDER_COLLECTION,
        context: {
          ...(req?.context ?? {}),
          [SKIP_ORDER_EVENT_HOOK_CONTEXT_KEY]: true
        },
        data: {
          confirmationStatus: "rejected",
          lifecycleStatus: "cancelled",
          paymentStatus: "cancelled"
        },
        id: order.id,
        overrideAccess: true,
        req
      })) as PayloadOrderDocument;

      await appendOrderEvent({
        actorType: "admin",
        eventType: "confirmation_updated",
        internalMessage: "Order rejected by admin.",
        isPublic: true,
        order: order.id,
        payload,
        publicMessage: "Order could not be confirmed.",
        req
      });

      return updated;
    }
    case "assign_courier": {
      if (!input.providerSlug) {
        throw new Error("A provider slug is required to assign a courier.");
      }

      const provider = await getCourierDocument({
        payload,
        slug: input.providerSlug
      });

      if (!provider) {
        throw new Error(`Unknown provider "${input.providerSlug}".`);
      }

      if (order.confirmationStatus !== "confirmed") {
        throw new Error("Confirm the order before assigning a courier.");
      }

      assertOrderIsMutable({
        message: "This order can no longer be assigned to a courier.",
        order
      });

      if (!["confirmed", "preparing", "submitted_to_courier"].includes(order.lifecycleStatus)) {
        throw new Error(
          `Cannot assign or change the courier while the order is "${order.lifecycleStatus}".`
        );
      }

      const deliveryPriceMinor =
        typeof input.deliveryPriceMajor === "number"
          ? toMinorUnits(input.deliveryPriceMajor)
          : order.deliveryPriceMinor;

      const updated = (await payload.update({
        collection: ORDER_COLLECTION,
        context: {
          ...(req?.context ?? {}),
          [SKIP_ORDER_EVENT_HOOK_CONTEXT_KEY]: true
        },
        data: {
          assignedCourier: provider.id,
          deliveryPriceMinor,
          fragile: input.fragile ?? order.fragile,
          insuranceEnabled: input.insuranceEnabled ?? order.insuranceEnabled,
          parcelHeightCm: input.parcelHeightCm ?? order.parcelHeightCm,
          parcelLengthCm: input.parcelLengthCm ?? order.parcelLengthCm,
          parcelWeightKg: input.parcelWeightKg ?? order.parcelWeightKg,
          parcelWidthCm: input.parcelWidthCm ?? order.parcelWidthCm,
          stationCode: input.stationCode ?? order.stationCode,
          stockType: input.stockType ?? order.stockType,
          trackingURL:
            order.trackingURL ??
            buildTrackingUrl({
              template: provider.trackingURLTemplate,
              trackingNumber: order.trackingNumber
            }),
          deliveryWilayaCode: input.wilayaCode ?? order.deliveryWilayaCode,
          totalMinor: order.subtotalMinor + deliveryPriceMinor
        },
        id: order.id,
        overrideAccess: true,
        req
      })) as PayloadOrderDocument;

      await appendOrderEvent({
        actorLabel: provider.title,
        actorType: "admin",
        eventType: "courier_assigned",
        internalMessage: `Courier assigned: ${provider.title}.`,
        order: order.id,
        payload,
        req
      });

      return updated;
    }
    case "submit_shipment": {
      const provider =
        order.assignedCourier && typeof order.assignedCourier === "object"
          ? (order.assignedCourier as PayloadShippingProviderDocument)
          : input.providerSlug
            ? await getCourierDocument({
              payload,
              slug: input.providerSlug
            })
            : null;

      if (!provider) {
        throw new Error("Assign a courier before submitting a shipment.");
      }

      if (order.confirmationStatus !== "confirmed") {
        throw new Error("Confirm the order before submitting it to a courier.");
      }

      if (!["confirmed", "preparing", "submitted_to_courier"].includes(order.lifecycleStatus)) {
        throw new Error(`Cannot submit a shipment while the order is "${order.lifecycleStatus}".`);
      }

      const adapter = getCourierAdapter(provider);
      const shipmentPayload = adapter.buildShipmentPayload(order);
      const shipment = await adapter.createShipment({
        order,
        payload: shipmentPayload
      });
      const updated = await applyCourierUpdate({
        payload,
        provider,
        req,
        update: shipment
      });

      if (!updated) {
        throw new Error("Shipment submission did not resolve to a tracked order.");
      }

      await appendOrderEvent({
        actorLabel: provider.title,
        actorType: "admin",
        eventType: "shipment_submitted",
        internalMessage: "Shipment submitted to courier.",
        isPublic: true,
        order: order.id,
        payload,
        publicMessage: "Order handed off to the delivery partner.",
        req
      });

      return updated;
    }
    case "sync_courier": {
      const updated = await syncCourierOrderStatus({
        order,
        payload,
        req
      });

      return updated;
    }
    case "attach_tracking": {
      if (!input.trackingNumber) {
        throw new Error("Tracking number is required.");
      }

      assertOrderIsMutable({
        message: "Tracking can no longer be attached to this order.",
        order
      });

      const provider =
        order.assignedCourier && typeof order.assignedCourier === "object"
          ? (order.assignedCourier as PayloadShippingProviderDocument)
          : null;
      const updated = (await payload.update({
        collection: ORDER_COLLECTION,
        context: {
          ...(req?.context ?? {}),
          [SKIP_ORDER_EVENT_HOOK_CONTEXT_KEY]: true
        },
        data: {
          trackingNumber: input.trackingNumber,
          trackingURL:
            input.trackingURL ??
            buildTrackingUrl({
              template: provider?.trackingURLTemplate,
              trackingNumber: input.trackingNumber
            }),
          lifecycleStatus:
            order.lifecycleStatus === "new" || order.lifecycleStatus === "confirmed"
              ? "submitted_to_courier"
              : order.lifecycleStatus
        },
        id: order.id,
        overrideAccess: true,
        req
      })) as PayloadOrderDocument;

      await appendOrderEvent({
        actorType: "admin",
        eventType: "tracking_updated",
        internalMessage: "Tracking number attached manually.",
        isPublic: true,
        order: order.id,
        payload,
        publicMessage: "Tracking details are now available.",
        req
      });

      return updated;
    }
    case "update_delivery_status": {
      if (!input.lifecycleStatus) {
        throw new Error("Lifecycle status is required.");
      }

      assertLifecycleTransitionAllowed({
        nextStatus: input.lifecycleStatus,
        order
      });

      const updated = (await payload.update({
        collection: ORDER_COLLECTION,
        context: {
          ...(req?.context ?? {}),
          [SKIP_ORDER_EVENT_HOOK_CONTEXT_KEY]: true
        },
        data: {
          lifecycleStatus: input.lifecycleStatus,
          rawCourierStatus: input.lifecycleStatus,
          trackingNumber: input.trackingNumber ?? order.trackingNumber,
          trackingURL: input.trackingURL ?? order.trackingURL
        },
        id: order.id,
        overrideAccess: true,
        req
      })) as PayloadOrderDocument;

      await appendOrderEvent({
        actorType: "admin",
        eventType: "lifecycle_updated",
        internalMessage: `Lifecycle status set to "${input.lifecycleStatus}".`,
        isPublic: true,
        order: order.id,
        payload,
        publicMessage: `Order status updated: ${input.lifecycleStatus.replace(/_/g, " ")}.`,
        req
      });

      return updated;
    }
    case "update_exchange": {
      const exchangeStatus = input.exchangeStatus ?? order.exchangeStatus;

      if (order.lifecycleStatus === "cancelled") {
        throw new Error("Cancelled orders cannot move through exchange workflow.");
      }

      assertExchangeTransitionAllowed({
        nextStatus: exchangeStatus,
        order
      });

      const updated = (await payload.update({
        collection: ORDER_COLLECTION,
        context: {
          ...(req?.context ?? {}),
          [SKIP_ORDER_EVENT_HOOK_CONTEXT_KEY]: true
        },
        data: {
          exchangeNote: input.exchangeNote ?? order.exchangeNote,
          exchangeStatus,
          productToChange: input.productToChange ?? order.productToChange
        },
        id: order.id,
        overrideAccess: true,
        req
      })) as PayloadOrderDocument;

      await appendOrderEvent({
        actorType: "admin",
        eventType: "exchange_updated",
        internalMessage: `Exchange status set to "${exchangeStatus}".`,
        order: order.id,
        payload,
        req
      });

      return updated;
    }
    default:
      throw new Error(`Unsupported order action: ${input.action}.`);
  }
};

export const exportOrdersForOperations = async ({ req }: { req?: PayloadRequest }) => {
  const { payload } = await getPayloadAndReq(req);
  const result = await payload.find({
    collection: ORDER_COLLECTION,
    depth: 1,
    overrideAccess: true,
    pagination: false,
    sort: "-createdAt"
  });

  return (result.docs as PayloadOrderDocument[]).map((order) => {
    const provider =
      order.assignedCourier && typeof order.assignedCourier === "object"
        ? (order.assignedCourier as PayloadShippingProviderDocument)
        : null;
    const items = Array.isArray(order.items) ? order.items : [];
    const firstItem = items[0];
    const productText = items
      .map((item) => item.productName || "")
      .filter(Boolean)
      .join(", ");

    return {
      ADRESSE: order.deliveryAddress ?? "",
      CODE_WILAYA: order.deliveryWilayaCode ?? "",
      COMMUNE: order.deliveryCommune,
      CONFIRMATION: order.confirmationStatus,
      DATE: order.createdAt,
      "DELIVERY MODE": order.deliveryMode,
      "DELIVERY PRICE": fromMinorUnits(order.deliveryPriceMinor),
      EXCHANGE: order.exchangeStatus !== "none" ? "Yes" : "No",
      FRAGILE: order.fragile ? "Yes" : "No",
      INSURANCE: order.insuranceEnabled ? "Yes" : "No",
      NAME: order.customerFullName,
      NOTE: order.deliveryNote ?? "",
      "ORDER ID": order.orderRef,
      PHONE: order.customerPhone,
      PRODUCT: productText,
      "PRODUCT Option": firstItem?.optionLabel ?? "",
      "PROCDUCT PRICE": fromMinorUnits(order.subtotalMinor),
      "PRODUCT TO CHANGE": order.productToChange ?? "",
      QUANTITY: items.reduce((total, item) => total + Number(item.quantity ?? 0), 0),
      "RAW STATUS": order.rawCourierStatus ?? "",
      SOCIETE: provider?.title ?? "",
      STATION: order.deliveryStation ?? "",
      STATUS: order.lifecycleStatus,
      "STOCK TYPE": order.stockType ?? "",
      "TOTAL PRICE": fromMinorUnits(order.totalMinor),
      TRACKING: order.trackingNumber ?? "",
      WEIGHT: order.parcelWeightKg ?? "",
      WILAYA: order.deliveryWilaya
    };
  });
};
