import type { PayloadOrderDocument, PayloadShippingProviderDocument } from "@/lib/payload/types";

export type CourierUpdate = {
  labelURL?: string;
  lifecycleStatus?: PayloadOrderDocument["lifecycleStatus"];
  orderRef?: string;
  providerOrderID?: string;
  rawPayload?: Record<string, unknown>;
  rawStatus?: string;
  trackingNumber?: string;
  trackingURL?: string;
};

export type CourierImportArgs = {
  mapperVersion: string;
  rows: Array<Record<string, unknown>>;
  sourceText?: string;
};

export interface CourierAdapter {
  buildShipmentPayload(order: PayloadOrderDocument): Record<string, unknown>;
  createShipment(args: {
    order: PayloadOrderDocument;
    payload: Record<string, unknown>;
  }): Promise<CourierUpdate>;
  getLabel(args: { order: PayloadOrderDocument; trackingNumber: string }): Promise<string | null>;
  getShipment(args: {
    order: PayloadOrderDocument;
    trackingNumber: string;
  }): Promise<CourierUpdate>;
  importStatuses(args: CourierImportArgs): Promise<CourierUpdate[]>;
  mapRawStatus(rawStatus: string | null | undefined): PayloadOrderDocument["lifecycleStatus"];
  parseWebhook(payload: unknown): Promise<CourierUpdate[]>;
  quote(args: { fromWilayaId?: number; toWilayaId?: number }): Promise<Record<string, unknown>>;
  testCredentials(): Promise<boolean>;
}

export type CourierAdapterFactory = (provider: PayloadShippingProviderDocument) => CourierAdapter;
