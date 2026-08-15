/**
 * Single place for the store's identity and contact details.
 *
 * The contact fields are intentionally empty: the UI hides each one until it is
 * filled in, so the storefront never ships a placeholder phone number or email
 * that a customer might actually try to reach.
 */
export const BRAND = {
  /** Latin brand name, used in metadata, JSON-LD and the footer. */
  name: "Roya",
  /** Arabic brand name. */
  nameAr: "رؤية",
  /** Full legal/trading name shown in structured data. */
  legalName: "Roya Optique",
  /** Contact email. Leave empty to hide every "email us" affordance. */
  email: "",
  /** Public phone numbers in local format. Leave empty to hide the call buttons. */
  phones: [] as string[],
  /** WhatsApp number in international format without "+", e.g. "213700000000". */
  whatsapp: ""
} as const;

export const getSiteUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Turns a display number like "0700 00 00 00" into a `tel:` target. */
export const toTelHref = (phone: string) => `tel:${phone.replace(/\s+/g, "")}`;
