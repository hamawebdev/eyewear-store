export const ORDER_SOURCE_VALUES = ["storefront", "manual", "import"] as const;

export const DELIVERY_MODE_VALUES = ["office", "home"] as const;

export const CONFIRMATION_STATUS_VALUES = [
  "pending",
  "confirmed",
  "unreachable",
  "rejected"
] as const;

export const PAYMENT_STATUS_VALUES = ["pending_cod", "paid", "cancelled"] as const;

export const LIFECYCLE_STATUS_VALUES = [
  "new",
  "confirmed",
  "preparing",
  "submitted_to_courier",
  "in_transit",
  "delivered",
  "delivery_failed",
  "returned",
  "cancelled"
] as const;

export const EXCHANGE_STATUS_VALUES = [
  "none",
  "requested",
  "approved",
  "shipped",
  "completed",
  "declined"
] as const;

export const SHIPPING_PROVIDER_FAMILY_VALUES = [
  "yalidine",
  "ecotrack",
  "procolis",
  "custom"
] as const;

export const ORDER_EVENT_TYPE_VALUES = [
  "created",
  "confirmation_updated",
  "payment_updated",
  "lifecycle_updated",
  "courier_assigned",
  "shipment_submitted",
  "tracking_updated",
  "courier_synced",
  "exchange_updated",
  "note_added",
  "import_processed",
  "webhook_processed",
  "export_generated"
] as const;

export const ORDER_EVENT_ACTOR_VALUES = [
  "system",
  "admin",
  "customer",
  "courier",
  "import"
] as const;

export const ORDER_ACTION_VALUES = [
  "confirm",
  "reject",
  "assign_courier",
  "submit_shipment",
  "sync_courier",
  "attach_tracking",
  "update_delivery_status",
  "update_exchange"
] as const;

export const COURIER_SYNC_MODE_VALUES = ["webhook", "import", "poll"] as const;

export const COURIER_SYNC_STATUS_VALUES = ["pending", "completed", "failed"] as const;

export const DEFAULT_STORE_CURRENCY = process.env.NEXT_PUBLIC_STORE_CURRENCY?.trim() || "USD";
