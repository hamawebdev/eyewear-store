/**
 * Thin browser-side wrapper around `window.fbq` (the Meta Pixel global).
 *
 * Every function guards on the existence of `window.fbq`, so calls are safe (and
 * silent no-ops) during SSR, before the Pixel script loads, or when the Pixel is
 * disabled entirely. Callers never need to check whether the Pixel is enabled.
 */

import type { MetaCustomData, MetaEventName } from "@/lib/meta/events";
import { META_EVENTS } from "@/lib/meta/events";

type FbqArgs =
  | ["init", string]
  | ["track", MetaEventName, MetaCustomData?, { eventID?: string }?]
  | ["trackCustom", string, MetaCustomData?, { eventID?: string }?];

type Fbq = ((...args: FbqArgs) => void) & {
  queue?: unknown[];
  loaded?: boolean;
};

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

const getFbq = (): Fbq | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.fbq;
};

/**
 * Track a standard Meta event. Pass `eventID` for events that are also sent
 * server-side via the Conversions API (e.g. Purchase) so Meta can deduplicate
 * the browser + server copies into a single conversion.
 */
export const trackPixel = (
  eventName: MetaEventName,
  params?: MetaCustomData,
  options?: { eventID?: string }
) => {
  const fbq = getFbq();
  if (!fbq) {
    return;
  }

  fbq("track", eventName, params, options);
};

/** Convenience helper for the most common event. */
export const trackPixelPageView = () => {
  trackPixel(META_EVENTS.pageView);
};
