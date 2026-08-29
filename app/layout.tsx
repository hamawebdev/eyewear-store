import type React from "react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { ADMIN_LANGUAGE_COOKIE, normalizeAdminLanguage } from "@/lib/admin-i18n";
import { PATHNAME_HEADER, isAdminPathname } from "@/lib/admin-routes";
import {
  getStorefrontHtmlLang,
  getStorefrontDirection,
  STOREFRONT_LANGUAGE_COOKIE,
  normalizeStorefrontLanguage
} from "@/lib/storefront-language";
import MetaPixel from "@/components/meta/MetaPixel";
import MetaPageView from "@/components/meta/MetaPageView";
import { BRAND, getSiteUrl, getSocialProfiles } from "@/lib/brand";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    template: `%s | ${BRAND.name}`,
    default: `${BRAND.name} - Sunglasses, Optical Frames and Blue-Light Glasses in Bordj Bou Arreridj`
  },
  description:
    "Shop sunglasses, optical frames, blue-light glasses and reading glasses with real UV400 protection from Bordj Bou Arreridj, delivered across Algeria.",
  keywords: [
    "eyewear Bordj Bou Arreridj",
    "sunglasses Bordj Bou Arreridj",
    "opticien Bordj Bou Arreridj",
    "lunettes Bordj Bou Arreridj",
    "eyewear Algeria",
    "sunglasses Algeria",
    "optical frames",
    "blue light glasses",
    "reading glasses",
    "buy glasses online"
  ],
  openGraph: {
    title: `${BRAND.name} - Sunglasses, Optical Frames and Blue-Light Glasses in Bordj Bou Arreridj`,
    description:
      "Sunglasses, optical frames, blue-light glasses and readers, chosen for real UV protection and a fair price. Based in Bordj Bou Arreridj, with delivery across Algeria.",
    siteName: BRAND.name,
    locale: "ar_DZ",
    type: "website"
  },
  // Google Search Console ownership for herizioptic.com. Public by design — it
  // only proves control of the site, so it is safe to keep in the repo. Needed to
  // request re-indexing after the Roya -> Herizi rename.
  verification: {
    google: "KroSfXNBYkGVA7OAnkN3YPOHqiPkhqD3bO4UceIyqrE"
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const isAdmin = isAdminPathname(headerList.get(PATHNAME_HEADER));

  // The Payload admin sits under this same <html>, but it is French/English only.
  // Without this branch it would inherit the storefront's language and direction,
  // and since the storefront defaults to Arabic the admin would render mirrored.
  const initialLanguage = normalizeStorefrontLanguage(
    cookieStore.get(STOREFRONT_LANGUAGE_COOKIE)?.value
  );
  const htmlLang = isAdmin
    ? normalizeAdminLanguage(cookieStore.get(ADMIN_LANGUAGE_COOKIE)?.value)
    : getStorefrontHtmlLang(initialLanguage);
  const htmlDir = isAdmin ? "ltr" : getStorefrontDirection(initialLanguage);

  return (
    <html lang={htmlLang} dir={htmlDir}>
      <head>
        {/* No facebook-domain-verification tag yet for this domain — add the
            value from Meta Business Manager here when the pixel is set up. */}
        <link
          rel="preload"
          href="/fonts/Adelle_Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* The hero poster is the LCP element. Without fetchPriority the
            preload starts at Chrome's default "Low" priority for images, and
            the <img fetchpriority="high"> that later matches it cannot upgrade
            an already in-flight request — which left the LCP image queued
            behind the CSS and every JS chunk. These must stay in sync with the
            <picture> in components/sections/Hero.tsx. A browser that does not
            support the declared type ignores the preload, so the JPEG fallback
            path costs nothing here. */}
        <link
          rel="preload"
          href="/hero-poster-mobile.webp"
          as="image"
          type="image/webp"
          fetchPriority="high"
          media="(max-width: 767px)"
        />
        <link
          rel="preload"
          href="/hero-poster.webp"
          as="image"
          type="image/webp"
          fetchPriority="high"
          media="(min-width: 768px)"
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: BRAND.name,
              alternateName: BRAND.nameAr,
              legalName: BRAND.legalName,
              url: getSiteUrl(),
              logo: `${getSiteUrl()}/logo.svg`,
              ...(BRAND.email ? { email: BRAND.email } : {}),
              ...(BRAND.phones.length > 0 ? { telephone: BRAND.phones } : {}),
              ...(getSocialProfiles().length > 0 ? { sameAs: getSocialProfiles() } : {}),
              address: {
                "@type": "PostalAddress",
                addressLocality: "Bordj Bou Arreridj",
                addressRegion: "Bordj Bou Arreridj",
                addressCountry: "DZ"
              }
            })
          }}
        />
        <MetaPixel />
        <MetaPageView />
        {children}
      </body>
    </html>
  );
}
