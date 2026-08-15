import {
  DEFAULT_STORE_CURRENCY,
  EXCHANGE_STATUS_VALUES,
  LIFECYCLE_STATUS_VALUES
} from "./constants";

const LIFE_CYCLE_SET = new Set<string>(LIFECYCLE_STATUS_VALUES);
const EXCHANGE_STATUS_SET = new Set<string>(EXCHANGE_STATUS_VALUES);

export const normalizePhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  let normalized = digits;

  if (normalized.startsWith("213")) {
    normalized = normalized.slice(3);
  }

  if (normalized.startsWith("0") && normalized.length === 10) {
    normalized = normalized.slice(1);
  }

  if (normalized.length > 9) {
    normalized = normalized.slice(-9);
  }

  return normalized;
};

export const toMinorUnits = (value: number) => Math.round(value * 100);

export const fromMinorUnits = (value: number) => value / 100;

export const formatMinorCurrency = (
  value: number,
  currency = getCurrency(),
  locale = "en-DZ"
) =>
  new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency"
  }).format(fromMinorUnits(value));

export const getCurrency = () => DEFAULT_STORE_CURRENCY;

export const splitCustomerName = (fullName: string) => {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return {
      familyName: "",
      firstName: ""
    };
  }

  const [firstName, ...rest] = trimmed.split(/\s+/);

  return {
    familyName: rest.join(" ") || firstName,
    firstName
  };
};

export const normalizeLifecycleStatus = (value: string | null | undefined) => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");

  return LIFE_CYCLE_SET.has(normalized) ? normalized : undefined;
};

export const normalizeExchangeStatus = (value: string | null | undefined) => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");

  return EXCHANGE_STATUS_SET.has(normalized) ? normalized : undefined;
};

export const buildTrackingUrl = ({
  template,
  trackingNumber
}: {
  template?: null | string;
  trackingNumber?: null | string;
}) => {
  if (!template || !trackingNumber) {
    return undefined;
  }

  return template.replace(/\{\{\s*trackingNumber\s*\}\}/g, trackingNumber);
};

export const coercePositiveNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return undefined;
};

export const stringifyProductsForCourier = (
  items: Array<{ optionLabel?: string; productName: string; quantity: number }>
) =>
  items
    .map((item) =>
      [item.quantity > 1 ? `${item.quantity}x` : "", item.productName, item.optionLabel]
        .filter(Boolean)
        .join(" ")
        .trim()
    )
    .join(", ");
