import { z } from "zod";
import { LocalizedTextSchema } from "@/lib/localized-text";
import {
  CONFIRMATION_STATUS_VALUES,
  COURIER_SYNC_MODE_VALUES,
  COURIER_SYNC_STATUS_VALUES,
  DEFAULT_STORE_CURRENCY,
  DELIVERY_MODE_VALUES,
  EXCHANGE_STATUS_VALUES,
  LIFECYCLE_STATUS_VALUES,
  ORDER_ACTION_VALUES,
  ORDER_EVENT_ACTOR_VALUES,
  ORDER_EVENT_TYPE_VALUES,
  ORDER_SOURCE_VALUES,
  PAYMENT_STATUS_VALUES,
  SHIPPING_PROVIDER_FAMILY_VALUES
} from "./constants";

const positiveMoney = z.number().finite().nonnegative();

export const DeliveryModeSchema = z.enum(DELIVERY_MODE_VALUES);
export const OrderSourceSchema = z.enum(ORDER_SOURCE_VALUES);
export const ConfirmationStatusSchema = z.enum(CONFIRMATION_STATUS_VALUES);
export const PaymentStatusSchema = z.enum(PAYMENT_STATUS_VALUES);
export const LifecycleStatusSchema = z.enum(LIFECYCLE_STATUS_VALUES);
export const ExchangeStatusSchema = z.enum(EXCHANGE_STATUS_VALUES);
export const ShippingProviderFamilySchema = z.enum(SHIPPING_PROVIDER_FAMILY_VALUES);
export const OrderEventTypeSchema = z.enum(ORDER_EVENT_TYPE_VALUES);
export const OrderEventActorSchema = z.enum(ORDER_EVENT_ACTOR_VALUES);
export const OrderActionSchema = z.enum(ORDER_ACTION_VALUES);
export const CourierSyncModeSchema = z.enum(COURIER_SYNC_MODE_VALUES);
export const CourierSyncStatusSchema = z.enum(COURIER_SYNC_STATUS_VALUES);

export const CartItemSchema = z.object({
  id: z.string(),
  image: z.string(),
  name: LocalizedTextSchema,
  optionId: z.string().optional(),
  optionLabel: LocalizedTextSchema.optional(),
  price: positiveMoney,
  productId: z.string(),
  productSlug: z.string(),
  quantity: z.number().int().min(1)
});

const CHECKOUT_MESSAGES = {
  ar: {
    fullNameRequired: "الاسم الكامل مطلوب",
    noteMaxLength: "لا يمكن أن تتجاوز الملاحظة 500 حرف",
    phoneInvalid: "يرجى إدخال رقم هاتف صحيح",
    wilayaRequired: "الولاية مطلوبة",
    addressRequired: "العنوان مطلوب للتوصيل المنزلي"
  },
  fr: {
    fullNameRequired: "Le nom complet est requis",
    noteMaxLength: "La note ne peut pas dépasser 500 caractères",
    phoneInvalid: "Veuillez saisir un numéro de téléphone valide",
    wilayaRequired: "La wilaya est requise",
    addressRequired: "L'adresse est requise pour la livraison à domicile"
  },
  en: {
    fullNameRequired: "Full name is required",
    noteMaxLength: "Note cannot be longer than 500 characters",
    phoneInvalid: "Please enter a valid phone number",
    wilayaRequired: "Wilaya is required",
    addressRequired: "Address is required for home delivery"
  }
} as const;

const buildCheckoutSchema = (locale: "ar" | "fr" | "en" = "en") => {
  const msgs = CHECKOUT_MESSAGES[locale];
  return z
    .object({
      address: z.string().trim().optional(),
      commune: z.string().trim().optional(),
      fullName: z.string().trim().min(2, msgs.fullNameRequired),
      note: z.string().trim().max(500, msgs.noteMaxLength).optional(),
      phoneNumber: z
        .string()
        .trim()
        .regex(/^[0-9+\s()-]{8,20}$/, msgs.phoneInvalid),
      shippingMethod: DeliveryModeSchema,
      station: z.string().trim().optional(),
      wilaya: z.string().min(1, msgs.wilayaRequired)
    })
    .superRefine((value, ctx) => {
      if (value.shippingMethod === "home" && !value.address) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: msgs.addressRequired,
          path: ["address"]
        });
      }
    });
};

export const CheckoutSchema = buildCheckoutSchema("en");
export { buildCheckoutSchema };

export const CreateOrderItemInputSchema = z.object({
  optionId: z.string().optional(),
  productId: z.string(),
  quantity: z.number().int().min(1).max(99)
});

export const CreateOrderInputSchema = CheckoutSchema.extend({
  items: z.array(CreateOrderItemInputSchema).min(1, "At least one item is required"),
  locale: z.enum(["ar", "fr", "en"]).optional().default("ar"),
  submissionKey: z.string().trim().min(8, "Submission key is required")
});

export const CourierAssignmentSchema = z.object({
  providerId: z.string().optional(),
  providerOrderId: z.string().optional(),
  providerSlug: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingURL: z.string().url().optional()
});

export const CourierStatusSnapshotSchema = z.object({
  labelURL: z.string().url().optional(),
  lifecycleStatus: LifecycleStatusSchema,
  providerOrderId: z.string().optional(),
  rawStatus: z.string().optional(),
  syncedAt: z.string().datetime().optional(),
  trackingNumber: z.string().optional(),
  trackingURL: z.string().url().optional()
});

export const ExchangeRequestSchema = z.object({
  exchangeNote: z.string().trim().max(500).optional(),
  exchangeStatus: ExchangeStatusSchema.default("none"),
  productToChange: z.string().trim().max(200).optional()
});

export const OrderItemSnapshotSchema = z.object({
  image: z.string(),
  lineTotalMinor: z.number().int().nonnegative(),
  optionId: z.string().optional(),
  optionLabel: z.string().optional(),
  originalUnitPriceMinor: z.number().int().nonnegative().optional(),
  productId: z.string(),
  productName: z.string(),
  productSlug: z.string(),
  quantity: z.number().int().min(1),
  stockType: z.string().optional(),
  unitPriceMinor: z.number().int().nonnegative(),
  weightGrams: z.number().int().nonnegative().optional()
});

export const OrderSummarySchema = z.object({
  confirmationStatus: ConfirmationStatusSchema,
  createdAt: z.string().datetime(),
  currency: z.string().default(DEFAULT_STORE_CURRENCY),
  deliveryMode: DeliveryModeSchema,
  exchangeStatus: ExchangeStatusSchema,
  itemCount: z.number().int().nonnegative(),
  lifecycleStatus: LifecycleStatusSchema,
  orderRef: z.string(),
  paymentStatus: PaymentStatusSchema,
  totalMinor: z.number().int().nonnegative(),
  trackingNumber: z.string().optional()
});

export const PublicOrderEventSchema = z.object({
  createdAt: z.string().datetime(),
  eventType: OrderEventTypeSchema,
  message: z.string()
});

export const OrderLookupResultSchema = z.object({
  courier: z
    .object({
      provider: z.string().optional(),
      trackingNumber: z.string().optional(),
      trackingURL: z.string().optional()
    })
    .optional(),
  customer: z.object({
    fullName: z.string()
  }),
  events: z.array(PublicOrderEventSchema),
  order: OrderSummarySchema.extend({
    deliveryDestination: z.object({
      commune: z.string(),
      wilaya: z.string()
    })
  })
});

export const AdminOrderActionPayloadSchema = z.object({
  action: OrderActionSchema,
  confirmationStatus: ConfirmationStatusSchema.optional(),
  courierNote: z.string().trim().max(500).optional(),
  deliveryPriceMajor: positiveMoney.optional(),
  exchangeNote: z.string().trim().max(500).optional(),
  exchangeStatus: ExchangeStatusSchema.optional(),
  fragile: z.boolean().optional(),
  insuranceEnabled: z.boolean().optional(),
  lifecycleStatus: LifecycleStatusSchema.optional(),
  parcelHeightCm: z.number().positive().optional(),
  parcelLengthCm: z.number().positive().optional(),
  parcelWeightKg: z.number().positive().optional(),
  parcelWidthCm: z.number().positive().optional(),
  productToChange: z.string().trim().max(200).optional(),
  providerSlug: z.string().trim().optional(),
  stationCode: z.string().trim().optional(),
  stockType: z.string().trim().max(100).optional(),
  trackingNumber: z.string().trim().optional(),
  trackingURL: z.string().trim().url().optional(),
  wilayaCode: z.string().trim().max(10).optional()
});

export const CourierImportRequestSchema = z.object({
  csvText: z.string().optional(),
  dryRun: z.boolean().optional().default(false),
  mapperVersion: z.string().trim().default("order-table-v1"),
  providerSlug: z.string().trim().min(1, "Provider slug is required"),
  rows: z.array(z.record(z.string(), z.unknown())).optional()
});

export const CourierWebhookEnvelopeSchema = z.union([
  z.record(z.string(), z.unknown()),
  z.array(z.record(z.string(), z.unknown()))
]);

export const OrderLookupInputSchema = z.object({
  orderRef: z.string().trim().min(4, "Order reference is required"),
  phone: z.string().trim().min(8, "Phone number is required")
});

export type CartItem = z.infer<typeof CartItemSchema>;
export type AdminOrderActionPayload = z.infer<typeof AdminOrderActionPayloadSchema>;
export type CheckoutForm = z.infer<typeof CheckoutSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;
export type CreateOrderItemInput = z.infer<typeof CreateOrderItemInputSchema>;
export type CourierAssignment = z.infer<typeof CourierAssignmentSchema>;
export type CourierImportRequest = z.infer<typeof CourierImportRequestSchema>;
export type CourierStatusSnapshot = z.infer<typeof CourierStatusSnapshotSchema>;
export type ExchangeRequest = z.infer<typeof ExchangeRequestSchema>;
export type OrderAction = z.infer<typeof OrderActionSchema>;
export type OrderItemSnapshot = z.infer<typeof OrderItemSnapshotSchema>;
export type OrderLookupInput = z.infer<typeof OrderLookupInputSchema>;
export type OrderLookupResult = z.infer<typeof OrderLookupResultSchema>;
export type OrderSummary = z.infer<typeof OrderSummarySchema>;
export type PublicOrderEvent = z.infer<typeof PublicOrderEventSchema>;
