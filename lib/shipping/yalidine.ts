import { parseCsv } from "@/lib/orders/csv";
import type { PayloadOrderDocument, PayloadShippingProviderDocument } from "@/lib/payload/types";
import {
  buildTrackingUrl,
  fromMinorUnits,
  splitCustomerName,
  stringifyProductsForCourier
} from "@/lib/orders/utils";
import type { CourierAdapter, CourierImportArgs, CourierUpdate } from "./types";

type YalidineCredentials = {
  apiBaseUrl: string;
  apiId: string;
  apiToken: string;
};

const ensureString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const readFirstString = (value: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const candidate = ensureString(value[key]);

    if (candidate) {
      return candidate;
    }
  }

  return undefined;
};

const normalizeResponseRow = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object") {
    return {};
  }

  if (
    "data" in value &&
    Array.isArray(value.data) &&
    value.data[0] &&
    typeof value.data[0] === "object"
  ) {
    return value.data[0] as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
};

const loadCredentials = (provider: PayloadShippingProviderDocument): YalidineCredentials => {
  const prefix = provider.envCredentialPrefix.trim();
  const apiId = provider.apiId?.trim() || process.env[`${prefix}_API_ID`]?.trim();
  const apiToken = provider.apiToken?.trim() || process.env[`${prefix}_API_TOKEN`]?.trim();
  const apiBaseUrl =
    process.env[`${prefix}_API_BASE_URL`]?.trim() ||
    (provider.slug === "yalitec" ? "https://api.yalitec.me" : "https://api.yalidine.app");

  if (!apiId || !apiToken) {
    throw new Error(`Missing credentials for provider "${provider.slug}". Paste your API ID and Token in the Credentials tab, or set ${prefix}_API_ID and ${prefix}_API_TOKEN env vars.`);
  }

  return {
    apiBaseUrl,
    apiId,
    apiToken
  };
};

const buildHeaders = (credentials: YalidineCredentials) => ({
  "Content-Type": "application/json",
  "X-API-ID": credentials.apiId,
  "X-API-TOKEN": credentials.apiToken
});

const mapRawStatus = (
  rawStatus: string | null | undefined
): PayloadOrderDocument["lifecycleStatus"] => {
  const normalized = rawStatus?.trim().toLowerCase() || "";

  if (!normalized) {
    return "submitted_to_courier";
  }

  if (/deliv|livr/.test(normalized)) {
    return "delivered";
  }

  if (/return|retour/.test(normalized)) {
    return "returned";
  }

  if (/fail|echec|refus|annul|cancel/.test(normalized)) {
    return "delivery_failed";
  }

  if (/transit|route|dispatch|pickup|exped/.test(normalized)) {
    return "in_transit";
  }

  if (/submit|create|created/.test(normalized)) {
    return "submitted_to_courier";
  }

  if (/prepare/.test(normalized)) {
    return "preparing";
  }

  if (/confirm/.test(normalized)) {
    return "confirmed";
  }

  return "submitted_to_courier";
};

const mapUpdateFromUnknown = ({
  provider,
  raw
}: {
  provider: PayloadShippingProviderDocument;
  raw: unknown;
}): CourierUpdate => {
  const row = normalizeResponseRow(raw);
  const rawStatus = readFirstString(row, [
    "status",
    "last_status",
    "state",
    "parcel_status",
    "raw_status"
  ]);
  const trackingNumber = readFirstString(row, [
    "tracking",
    "tracking_number",
    "trackingNumber",
    "barcode",
    "code"
  ]);
  const providerOrderID = readFirstString(row, [
    "provider_order_id",
    "order_id",
    "reference",
    "ref",
    "id"
  ]);
  const labelURL = readFirstString(row, ["label", "label_url", "labelURL"]);

  return {
    labelURL,
    lifecycleStatus: mapRawStatus(rawStatus),
    orderRef: readFirstString(row, ["order_id", "orderRef"]),
    providerOrderID,
    rawPayload: row,
    rawStatus,
    trackingNumber,
    trackingURL:
      buildTrackingUrl({
        template: provider.trackingURLTemplate,
        trackingNumber
      }) || undefined
  };
};

class YalidineCourierAdapter implements CourierAdapter {
  private readonly credentials: YalidineCredentials;

  constructor(private readonly provider: PayloadShippingProviderDocument) {
    this.credentials = loadCredentials(provider);
  }

  async testCredentials() {
    const response = await fetch(`${this.credentials.apiBaseUrl}/v1/wilayas/`, {
      headers: buildHeaders(this.credentials),
      method: "GET"
    });

    if (response.status === 200) {
      return true;
    }

    if (response.status === 401 || response.status === 500) {
      return false;
    }

    throw new Error(`Yalidine credentials check failed with status ${response.status}.`);
  }

  async quote({ fromWilayaId, toWilayaId }: { fromWilayaId?: number; toWilayaId?: number }) {
    const url = new URL(`${this.credentials.apiBaseUrl}/v1/fees/`);

    if (typeof fromWilayaId === "number") {
      url.searchParams.set("from_wilaya_id", String(fromWilayaId));
    }

    if (typeof toWilayaId === "number") {
      url.searchParams.set("to_wilaya_id", String(toWilayaId));
    }

    const response = await fetch(url, {
      headers: buildHeaders(this.credentials),
      method: "GET"
    });

    if (!response.ok) {
      throw new Error(`Unable to fetch courier rates (${response.status}).`);
    }

    return (await response.json()) as Record<string, unknown>;
  }

  buildShipmentPayload(order: PayloadOrderDocument) {
    const { firstName, familyName } = splitCustomerName(order.customerFullName);
    const items = Array.isArray(order.items) ? order.items : [];
    const productList = stringifyProductsForCourier(
      items.map((item) => ({
        optionLabel: item.optionLabel ?? undefined,
        productName: item.productName ?? "Product",
        quantity: Number(item.quantity ?? 1)
      }))
    );

    return {
      address: order.deliveryAddress ?? order.deliveryStation ?? order.deliveryCommune,
      contact_phone: order.customerPhone,
      declared_value: fromMinorUnits(order.declaredValueMinor ?? order.totalMinor),
      do_insurance: Boolean(order.insuranceEnabled),
      familyname: familyName,
      firstname: firstName,
      freeshipping: order.deliveryPriceMinor === 0,
      from_wilaya_name: this.provider.originWilayaName,
      has_exchange: order.exchangeStatus !== "none",
      height: order.parcelHeightCm ?? 10,
      is_stopdesk: order.deliveryMode === "office",
      length: order.parcelLengthCm ?? 10,
      order_id: order.orderRef,
      price: fromMinorUnits(order.totalMinor),
      product_list: productList,
      product_to_collect: order.productToChange ?? undefined,
      stopdesk_id: order.stationCode ?? undefined,
      to_commune_name: order.deliveryCommune,
      to_wilaya_name: order.deliveryWilaya,
      weight: order.parcelWeightKg ?? 1,
      width: order.parcelWidthCm ?? 10
    };
  }

  async createShipment({
    payload
  }: {
    order: PayloadOrderDocument;
    payload: Record<string, unknown>;
  }): Promise<CourierUpdate> {
    const response = await fetch(`${this.credentials.apiBaseUrl}/v1/parcels/`, {
      body: JSON.stringify([payload]),
      headers: buildHeaders(this.credentials),
      method: "POST"
    });

    if (!response.ok) {
      throw new Error(`Shipment creation failed with status ${response.status}.`);
    }

    const json = (await response.json()) as Record<string, unknown>;
    const entry =
      (payload.order_id && typeof json[payload.order_id as string] === "object"
        ? json[payload.order_id as string]
        : json) ?? json;

    return {
      ...mapUpdateFromUnknown({
        provider: this.provider,
        raw: entry
      }),
      lifecycleStatus: "submitted_to_courier" as const,
      orderRef: ensureString(payload.order_id)
    };
  }

  async getShipment({
    trackingNumber
  }: {
    order: PayloadOrderDocument;
    trackingNumber: string;
  }): Promise<CourierUpdate> {
    const response = await fetch(`${this.credentials.apiBaseUrl}/v1/parcels/${trackingNumber}`, {
      headers: buildHeaders(this.credentials),
      method: "GET"
    });

    if (!response.ok) {
      throw new Error(`Shipment lookup failed with status ${response.status}.`);
    }

    return mapUpdateFromUnknown({
      provider: this.provider,
      raw: await response.json()
    });
  }

  async getLabel({
    order,
    trackingNumber
  }: {
    order: PayloadOrderDocument;
    trackingNumber: string;
  }) {
    const shipment = await this.getShipment({
      order,
      trackingNumber
    });

    return shipment.labelURL ?? null;
  }

  async parseWebhook(payload: unknown): Promise<CourierUpdate[]> {
    const rows = Array.isArray(payload)
      ? payload
      : payload && typeof payload === "object" && "data" in payload && Array.isArray(payload.data)
        ? payload.data
        : [payload];

    return rows
      .map((row) =>
        mapUpdateFromUnknown({
          provider: this.provider,
          raw: row
        })
      )
      .filter((row) => row.orderRef || row.providerOrderID || row.trackingNumber);
  }

  async importStatuses({ rows, sourceText }: CourierImportArgs): Promise<CourierUpdate[]> {
    const sourceRows = sourceText ? parseCsv(sourceText) : rows;

    return sourceRows
      .map((row) => ({
        lifecycleStatus: mapRawStatus(ensureString(row["RAW STATUS"] ?? row.STATUS)),
        orderRef: ensureString(row["ORDER ID"] ?? row.orderRef)?.toUpperCase(),
        rawPayload: row as Record<string, unknown>,
        rawStatus: ensureString(row["RAW STATUS"] ?? row.STATUS),
        trackingNumber: ensureString(row.TRACKING ?? row.trackingNumber)
      }))
      .filter((row) => row.orderRef || row.trackingNumber);
  }

  mapRawStatus(rawStatus: string | null | undefined) {
    return mapRawStatus(rawStatus);
  }
}

export const createYalidineCourierAdapter = (provider: PayloadShippingProviderDocument) =>
  new YalidineCourierAdapter(provider);
