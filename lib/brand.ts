/**
 * Single place for the store's identity and contact details.
 *
 * The contact fields are intentionally empty: the UI hides each one until it is
 * filled in, so the storefront never ships a placeholder phone number or email
 * that a customer might actually try to reach.
 */
export const BRAND = {
  /** Latin brand name, used in metadata, JSON-LD and the footer. */
  name: "Herizi",
  /** Arabic brand name. */
  nameAr: "حريزي",
  /** Full legal/trading name shown in structured data. */
  legalName: "Herizi Optic",
  /** Contact email. Leave empty to hide every "email us" affordance. */
  email: "",
  /** Public phone numbers in local format. Leave empty to hide the call buttons. */
  phones: [] as string[],
  /** WhatsApp numbers in international format without "+", e.g. "213700000000". */
  whatsapp: ["213790919597", "213784444307"] as string[],
  /** Public social profiles. Leave a URL empty to hide that button. */
  social: {
    instagram: "https://www.instagram.com/herizioptic34/",
    facebook: "https://web.facebook.com/profile.php?id=61593396159134"
  }
} as const;

/**
 * `??` only covers an unset NEXT_PUBLIC_APP_URL. A declared-but-empty one (as in
 * .env, and in any Docker build that omits the build arg) fell through as "",
 * and `new URL("")` in the root layout's metadataBase failed the whole build.
 */
export const getSiteUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");

/** Turns a display number like "0700 00 00 00" into a `tel:` target. */
export const toTelHref = (phone: string) => `tel:${phone.replace(/\s+/g, "")}`;

/** Turns an international WhatsApp number (no "+") into a `wa.me` link. */
export const toWhatsappHref = (whatsapp: string) => `https://wa.me/${whatsapp}`;

/** Renders an international WhatsApp number back into local display format, e.g. "0790 91 95 97". */
export const toLocalWhatsappDisplay = (whatsapp: string) => {
  const local = whatsapp.replace(/^213/, "0");
  return local.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4");
};

/** The social profile URLs that are actually configured, for JSON-LD `sameAs`. */
export const getSocialProfiles = () => Object.values(BRAND.social).filter(Boolean);
