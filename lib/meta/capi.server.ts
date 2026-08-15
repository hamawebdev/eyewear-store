import { createHash } from "node:crypto";
import { getMetaCapiConfig } from "@/lib/meta/config";
import type { MetaCustomData, MetaEventName } from "@/lib/meta/events";

/**
 * Server-side Meta Conversions API (CAPI) client.
 *
 * Recovers conversions that the browser Pixel loses to iOS/ITP/ad-blockers and
 * carries the COD Purchase signal from the server. PII is SHA-256 hashed per
 * Meta's normalization rules before transmission.
 *
 * IMPORTANT: nothing in this module is allowed to break the order flow. The
 * public entry point (`sendMetaServerEvent`) catches and logs all failures and
 * never throws, so a tracking error can never fail a customer's checkout.
 */

const GRAPH_API_VERSION = "v21.0";

export class MetaCapiError extends Error {}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Hash an already-normalized string, skipping empty values. */
const hashNormalized = (value: string | undefined | null) => {
  const normalized = value?.trim().toLowerCase();
  return normalized ? sha256(normalized) : undefined;
};

/**
 * Normalize a phone number for Meta: digits only, no leading zeros / plus / spaces.
 * Algerian local numbers (e.g. "0551234567") are converted to country format
 * ("213551234567") so they match the way Meta stores them.
 */
const hashPhone = (value: string | undefined | null) => {
  if (!value) {
    return undefined;
  }

  let digits = value.replace(/[^0-9]/g, "");
  if (!digits) {
    return undefined;
  }

  // Local Algerian format "0XXXXXXXXX" -> "213XXXXXXXXX".
  if (digits.startsWith("0")) {
    digits = `213${digits.slice(1)}`;
  }

  return sha256(digits);
};

/**
 * Split a full name into hashed first/last name fields. Meta expects each name
 * part lowercased and hashed separately.
 */
const hashName = (fullName: string | undefined | null) => {
  const trimmed = fullName?.trim();
  if (!trimmed) {
    return { fn: undefined, ln: undefined };
  }

  const parts = trimmed.split(/\s+/);
  const fn = hashNormalized(parts[0]);
  const ln = parts.length > 1 ? hashNormalized(parts.slice(1).join(" ")) : undefined;
  return { fn, ln };
};

export type MetaServerUserData = {
  fullName?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  country?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  /** `_fbp` cookie value (browser id). Sent un-hashed. */
  fbp?: string;
  /** `_fbc` click id cookie value. Sent un-hashed. */
  fbc?: string;
};

type MetaServerUserDataPayload = {
  fn?: string;
  ln?: string;
  ph?: string;
  em?: string;
  ct?: string;
  st?: string;
  country?: string;
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
};

const buildUserDataPayload = (userData: MetaServerUserData): MetaServerUserDataPayload => {
  const { fn, ln } = hashName(userData.fullName);

  return {
    fn,
    ln,
    ph: hashPhone(userData.phone),
    em: hashNormalized(userData.email),
    ct: hashNormalized(userData.city),
    st: hashNormalized(userData.state),
    country: hashNormalized(userData.country),
    client_ip_address: userData.clientIpAddress,
    client_user_agent: userData.clientUserAgent,
    fbp: userData.fbp,
    fbc: userData.fbc
  };
};

const stripUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;

export type SendMetaServerEventInput = {
  eventName: MetaEventName;
  /** Shared dedup key with the browser event (e.g. the order ref for Purchase). */
  eventId: string;
  eventSourceUrl?: string;
  userData: MetaServerUserData;
  customData?: MetaCustomData;
  /** Unix seconds; defaults to now. */
  eventTime?: number;
};

/**
 * Send a single server event to the Conversions API.
 *
 * No-ops (returns `{ sent: false }`) when CAPI is not configured. Never throws —
 * failures are logged and swallowed so the caller's primary work is unaffected.
 */
export const sendMetaServerEvent = async (
  input: SendMetaServerEventInput
): Promise<{ sent: boolean }> => {
  const config = getMetaCapiConfig();
  if (!config) {
    return { sent: false };
  }

  try {
    const event = stripUndefined({
      event_name: input.eventName,
      event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
      event_id: input.eventId,
      action_source: "website",
      event_source_url: input.eventSourceUrl,
      user_data: stripUndefined(buildUserDataPayload(input.userData)),
      custom_data: input.customData ? stripUndefined(input.customData) : undefined
    });

    const body: Record<string, unknown> = {
      data: [event],
      access_token: config.accessToken
    };

    if (config.testEventCode) {
      body.test_event_code = config.testEventCode;
    }

    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${config.pixelId}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store"
      }
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new MetaCapiError(
        `Conversions API returned ${response.status}. ${detail}`.trim()
      );
    }

    return { sent: true };
  } catch (error) {
    // Tracking must never break the order flow — log and move on.
    console.error(
      "[meta-capi] Failed to send server event:",
      error instanceof Error ? error.message : error
    );
    return { sent: false };
  }
};

/**
 * Parse a Cookie header into the Meta browser ids that improve match quality.
 * Both are optional and only present once the Pixel has run in the browser.
 */
export const parseMetaCookies = (cookieHeader: string | null) => {
  if (!cookieHeader) {
    return { fbp: undefined, fbc: undefined };
  }

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((part) => {
      const [name, ...rest] = part.trim().split("=");
      return [name, rest.join("=")];
    })
  );

  return {
    fbp: cookies["_fbp"] || undefined,
    fbc: cookies["_fbc"] || undefined
  };
};

/** Extract the client IP from common proxy headers. */
export const getClientIpFromHeaders = (headers: Headers) => {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || undefined;
  }
  return headers.get("x-real-ip")?.trim() || undefined;
};
