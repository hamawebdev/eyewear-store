"use client";

import Script from "next/script";
import { getMetaPixelId } from "@/lib/meta/config";

/**
 * Injects the Meta Pixel base snippet and fires the initial `PageView`.
 *
 * Renders nothing (and loads no script) when `NEXT_PUBLIC_META_PIXEL_ID` is
 * unset, keeping the integration fully inert until configured. Client-side
 * route changes are handled separately by `MetaPageView`, since the App Router
 * does not reload the page (and therefore does not re-run this snippet) on
 * navigation.
 */
export default function MetaPixel() {
  const pixelId = getMetaPixelId();

  if (!pixelId) {
    return null;
  }

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
