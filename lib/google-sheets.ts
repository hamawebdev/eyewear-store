import { randomUUID } from "node:crypto";
import { normalizeDocumentId } from "@/lib/document-id";
import { getMetaCurrency } from "@/lib/meta/config";
import { buildMetaContentId, type MetaContent } from "@/lib/meta/events";
import type { CreateOrderInput } from "@/lib/orders/schemas";
import { getPayloadClient } from "@/lib/payload/server";
import type { PayloadProductDocument, PayloadProductOptionRow } from "@/lib/payload/types";
import { findWilayaByLocalizedName } from "@/lib/wilaya-lookup";

export type GoogleSheetsOrderRow = {
  DATE: string;
  NAME: string;
  PHONE: string;
  "CODE WILAYA": string;
  WILAYA: string;
  ADRESSE: string;
  PRODUCT: string;
  "PRODUCT Option": string;
  QUANTITY: number;
  "DELIVERY PRICE": number;
  "TOTAL PRICE": number;
  "DELIVERY MODE": "Door Delivery" | "Stop Desk";
  LOCALE: string;
};

/**
 * Structured order data for Meta tracking, derived from the same authoritative
 * server-side pricing used for the Google Sheets row. The route consumes this for
 * the Conversions API Purchase event so we never trust client-sent prices.
 * `valueMajor` is in major currency units (e.g. 1800 DZD), as Meta expects.
 */
export type GoogleSheetsOrderMeta = {
  valueMajor: number;
  currency: string;
  contents: MetaContent[];
  contentIds: string[];
  numItems: number;
};

export class CheckoutValidationError extends Error {}

export class GoogleSheetsConfigurationError extends Error {}

export class GoogleSheetsSyncError extends Error {}

const GOOGLE_SHEETS_WEBHOOK_TIMEOUT_MS = 30_000;

const toMinorUnits = (value: number) => Math.round(value * 100);

const fromMinorUnits = (value: number) => value / 100;

const requirePositiveOrZeroNumber = ({
  field,
  value
}: {
  field: string;
  value: null | number | undefined;
}) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new CheckoutValidationError(`"${field}" is not configured correctly.`);
  }

  return value;
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

const normalizeDeliveryModeForSheet = (value: CreateOrderInput["shippingMethod"]) => {
  if (value === "home") {
    return "Door Delivery";
  }

  if (value === "office") {
    return "Stop Desk";
  }

  throw new CheckoutValidationError(`Unsupported delivery mode "${value}".`);
};

const buildAcknowledgementOrderRef = () => `GS-${randomUUID().slice(0, 8).toUpperCase()}`;

const readConfig = () => {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
  const webhookSecret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim();

  if (!webhookUrl) {
    throw new GoogleSheetsConfigurationError(
      "GOOGLE_SHEETS_WEBHOOK_URL is not configured."
    );
  }

  if (!webhookSecret) {
    throw new GoogleSheetsConfigurationError(
      "GOOGLE_SHEETS_WEBHOOK_SECRET is not configured."
    );
  }

  return {
    webhookSecret,
    webhookUrl
  };
};

export const buildGoogleSheetsOrderRow = async ({
  input
}: {
  input: CreateOrderInput;
}) => {
  const payload = await getPayloadClient();

  // The wilaya lookup and per-item product lookups are independent, so run
  // them in parallel to keep this (now request-blocking) validation step fast.
  const [selectedWilaya, lineItems] = await Promise.all([
    findWilayaByLocalizedName({
      name: input.wilaya,
      payload
    }),
    Promise.all(
      input.items.map(async (item) => {
        let product: PayloadProductDocument;

        try {
          product = (await payload.findByID({
            collection: "products",
            depth: 0,
            id: normalizeDocumentId(item.productId),
            overrideAccess: true
          })) as PayloadProductDocument;
        } catch (error) {
          throw new CheckoutValidationError(
            `A selected product is no longer available. ${
              error instanceof Error ? error.message : ""
            }`.trim()
          );
        }

        const option = getProductOption({
          optionId: item.optionId,
          product
        });

        if (item.optionId && !option) {
          throw new CheckoutValidationError(
            `Selected option is no longer available for "${product.name}".`
          );
        }

        const unitPrice = option?.price ?? product.displayPrice;

        if (typeof unitPrice !== "number" || !Number.isFinite(unitPrice) || unitPrice < 0) {
          throw new CheckoutValidationError(
            `Product "${product.name}" does not have a valid price.`
          );
        }

        return {
          lineTotalMinor: toMinorUnits(unitPrice) * item.quantity,
          optionId: item.optionId,
          optionLabel: option?.label?.trim() || "",
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPriceMajor: unitPrice
        };
      })
    )
  ]);

  if (!selectedWilaya?.name) {
    throw new CheckoutValidationError(`The selected wilaya "${input.wilaya}" is not recognized.`);
  }

  const wilayaCode = selectedWilaya.code?.trim();

  if (!wilayaCode) {
    throw new CheckoutValidationError(
      `The selected wilaya "${selectedWilaya.name}" is missing its code.`
    );
  }

  const deliveryPriceMajor =
    input.shippingMethod === "office"
      ? requirePositiveOrZeroNumber({
          field: "officeDeliveryPrice",
          value: selectedWilaya.officeDeliveryPrice
        })
      : requirePositiveOrZeroNumber({
          field: "homeDeliveryPrice",
          value: selectedWilaya.homeDeliveryPrice
        });

  const subtotalMinor = lineItems.reduce((total, item) => total + item.lineTotalMinor, 0);
  const deliveryPriceMinor = toMinorUnits(deliveryPriceMajor);
  const totalMinor = subtotalMinor + deliveryPriceMinor;

  // content ids follow the cart item convention "{productId}:{optionId}".
  const metaContents: MetaContent[] = lineItems.map((item) => ({
    id: buildMetaContentId(item.productId, item.optionId),
    quantity: item.quantity,
    item_price: item.unitPriceMajor
  }));

  const meta: GoogleSheetsOrderMeta = {
    valueMajor: fromMinorUnits(totalMinor),
    currency: getMetaCurrency(),
    contents: metaContents,
    contentIds: metaContents.map((content) => content.id),
    numItems: lineItems.reduce((total, item) => total + item.quantity, 0)
  };

  return {
    meta,
    orderRef: buildAcknowledgementOrderRef(),
    row: {
      DATE: new Date().toISOString(),
      NAME: input.fullName.trim(),
      PHONE: input.phoneNumber.trim(),
      "CODE WILAYA": wilayaCode,
      WILAYA: selectedWilaya.name.trim(),
      ADRESSE: input.address?.trim() || "",
      PRODUCT: lineItems.map((item) => item.productName).join(", "),
      "PRODUCT Option": lineItems
        .map((item) => item.optionLabel)
        .filter(Boolean)
        .join(", "),
      QUANTITY: lineItems.reduce((total, item) => total + item.quantity, 0),
      "DELIVERY PRICE": fromMinorUnits(deliveryPriceMinor),
      "TOTAL PRICE": fromMinorUnits(totalMinor),
      "DELIVERY MODE": normalizeDeliveryModeForSheet(input.shippingMethod),
      LOCALE: input.locale ?? "ar"
    } satisfies GoogleSheetsOrderRow
  };
};

export const sendGoogleSheetsOrderRow = async ({
  row
}: {
  row: GoogleSheetsOrderRow;
}) => {
  const { webhookSecret, webhookUrl } = readConfig();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GOOGLE_SHEETS_WEBHOOK_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(webhookUrl, {
      body: JSON.stringify({
        row,
        secret: webhookSecret
      }),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      signal: controller.signal
    });
  } catch (error) {
    throw new GoogleSheetsSyncError(
      `Unable to reach the Google Sheets webhook. ${
        error instanceof Error ? error.message : ""
      }`.trim()
    );
  } finally {
    clearTimeout(timeout);
  }

  const responseText = await response.text();
  let responseBody: unknown = null;

  if (responseText) {
    try {
      responseBody = JSON.parse(responseText) as unknown;
    } catch {
      responseBody = null;
    }
  }

  if (!response.ok) {
    throw new GoogleSheetsSyncError(
      `Google Sheets webhook returned ${response.status}.`
    );
  }

  if (
    !responseBody ||
    typeof responseBody !== "object" ||
    !("ok" in responseBody) ||
    responseBody.ok !== true
  ) {
    const errorMessage =
      responseBody &&
      typeof responseBody === "object" &&
      "error" in responseBody &&
      typeof responseBody.error === "string"
        ? responseBody.error
        : "Google Sheets webhook did not confirm the write.";

    throw new GoogleSheetsSyncError(errorMessage);
  }

  return responseBody;
};
