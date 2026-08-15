"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPixelPageView } from "@/lib/meta/pixel.client";

/**
 * Fires a `PageView` on client-side route changes.
 *
 * The Next.js App Router performs soft navigations that do not reload the page,
 * so the single `PageView` in the Pixel base snippet (`MetaPixel`) only covers
 * the initial load. This component covers every subsequent navigation. The very
 * first pathname is skipped to avoid double-counting the initial load.
 *
 * Safe to mount unconditionally: `trackPixelPageView` no-ops when the Pixel is
 * absent or not yet loaded.
 */
export default function MetaPageView() {
  const pathname = usePathname();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    trackPixelPageView();
  }, [pathname]);

  return null;
}
