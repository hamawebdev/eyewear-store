import type { PayloadShippingProviderDocument } from "@/lib/payload/types";
import { createYalidineCourierAdapter } from "./yalidine";
import type { CourierAdapter, CourierImportArgs, CourierUpdate } from "./types";

class UnsupportedCourierAdapter implements CourierAdapter {
  constructor(private readonly provider: PayloadShippingProviderDocument) {}

  buildShipmentPayload(): Record<string, unknown> {
    throw new Error(
      `Provider "${this.provider.slug}" does not support live shipment creation yet.`
    );
  }

  async createShipment(): Promise<CourierUpdate> {
    throw new Error(
      `Provider "${this.provider.slug}" does not support live shipment creation yet.`
    );
  }

  async getShipment(): Promise<CourierUpdate> {
    throw new Error(`Provider "${this.provider.slug}" does not support live shipment lookup yet.`);
  }

  async getLabel() {
    return null;
  }

  async parseWebhook(payload: unknown) {
    const rows = Array.isArray(payload) ? payload : [payload];

    return rows
      .map((row) => (row && typeof row === "object" ? (row as Record<string, unknown>) : {}))
      .map((row) => ({
        lifecycleStatus: "submitted_to_courier" as const,
        orderRef:
          typeof row["ORDER ID"] === "string" ? row["ORDER ID"].trim().toUpperCase() : undefined,
        rawPayload: row,
        rawStatus: typeof row.STATUS === "string" ? row.STATUS.trim() : undefined,
        trackingNumber: typeof row.TRACKING === "string" ? row.TRACKING.trim() : undefined
      }))
      .filter((row) => row.orderRef || row.trackingNumber);
  }

  async importStatuses({ rows, sourceText }: CourierImportArgs): Promise<CourierUpdate[]> {
    const parsedRows =
      sourceText
        ?.split(/\r?\n/)
        .map((line: string) => line.trim())
        .filter(Boolean)
        .map((line: string) => ({
          "ORDER ID": line
        })) ?? rows;

    return parsedRows
      .map((row: Record<string, unknown>) => ({
        lifecycleStatus: "submitted_to_courier" as const,
        orderRef:
          typeof row["ORDER ID"] === "string" ? row["ORDER ID"].trim().toUpperCase() : undefined,
        rawPayload: row,
        rawStatus:
          typeof row["RAW STATUS"] === "string"
            ? row["RAW STATUS"].trim()
            : typeof row.STATUS === "string"
              ? row.STATUS.trim()
              : undefined,
        trackingNumber: typeof row.TRACKING === "string" ? row.TRACKING.trim() : undefined
      }))
      .filter((row) => row.orderRef || row.trackingNumber);
  }

  mapRawStatus() {
    return "submitted_to_courier" as const;
  }

  async quote() {
    return {};
  }

  async testCredentials() {
    return false;
  }
}

export const getCourierAdapter = (provider: PayloadShippingProviderDocument): CourierAdapter => {
  if (
    provider.family === "yalidine" ||
    provider.slug === "yalidine" ||
    provider.slug === "yalitec"
  ) {
    return createYalidineCourierAdapter(provider);
  }

  return new UnsupportedCourierAdapter(provider);
};
