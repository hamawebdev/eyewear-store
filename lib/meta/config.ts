/**
 * Single source of truth for Meta (Facebook/Instagram) integration configuration.
 *
 * Everything reads from environment variables and is designed to gracefully
 * no-op when those vars are unset, mirroring the config-guard pattern used by
 * `readConfig()` in `lib/google-sheets.ts` and `loadCredentials` in the shipping
 * adapters. With no env vars configured, the Pixel script is never injected and
 * every Conversions API call is skipped, so the integration is fully inert.
 */

import { DEFAULT_STORE_CURRENCY } from "@/lib/orders/constants";

export type MetaCapiConfig = {
  accessToken: string;
  pixelId: string;
  testEventCode?: string;
};

const cleanEnv = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/**
 * Browser Pixel id (public). Returns `undefined` when unset, in which case the
 * Pixel base snippet must not be injected.
 */
export const getMetaPixelId = () => cleanEnv(process.env.NEXT_PUBLIC_META_PIXEL_ID);

export const isMetaPixelEnabled = () => Boolean(getMetaPixelId());

/**
 * Server-side Conversions API configuration. Returns `null` when the access
 * token is missing (CAPI disabled) so callers can early-return. The CAPI pixel
 * id falls back to the public Pixel id, since they are usually identical.
 */
export const getMetaCapiConfig = (): MetaCapiConfig | null => {
  const accessToken = cleanEnv(process.env.META_CAPI_ACCESS_TOKEN);
  const pixelId = cleanEnv(process.env.META_CAPI_PIXEL_ID) ?? getMetaPixelId();

  if (!accessToken || !pixelId) {
    return null;
  }

  return {
    accessToken,
    pixelId,
    testEventCode: cleanEnv(process.env.META_CAPI_TEST_EVENT_CODE)
  };
};

/**
 * Currency reported to Meta. Uses the store currency (DZD) and falls back to the
 * shared default so browser and server events always agree on the currency.
 */
export const getMetaCurrency = () => DEFAULT_STORE_CURRENCY;
