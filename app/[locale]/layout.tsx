import type React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import AppShell from "@/components/layout/app-shell";
import MetaPixel from "@/components/meta/MetaPixel";
import MetaPageView from "@/components/meta/MetaPageView";
import { BRAND, getSiteUrl, getSocialProfiles } from "@/lib/brand";
import {
  getStorefrontDirection,
  getStorefrontHtmlLang,
  isStorefrontLanguage,
  STOREFRONT_LANGUAGE_VALUES,
  type StorefrontLanguage
} from "@/lib/storefront-language";

/**
 * The production image is built in CI without a database (see
 * .github/workflows/build-and-push.yml — only NEXT_PUBLIC_* are passed), and
 * these routes read the catalogue. Prerendering them there would bake empty
 * pages into the image, so with no `DATABASE_URL` we generate no params and the
 * routes fall back to on-demand ISR instead: the first request per route renders
 * and is cached, and every request and prefetch after that is served from the
 * cache. Either way the routes stay statically cacheable at runtime, which is
 * what makes navigation instant.
 */
export function generateStaticParams() {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  return STOREFRONT_LANGUAGE_VALUES.map((locale) => ({ locale }));
}

/**
 * Site-wide defaults. These live here rather than as a `metadata` export because
 * a segment cannot export both `metadata` and `generateMetadata`, and the
 * canonical/hreflang pair below needs the locale — so they are merged in there.
 */
const BASE_METADATA: Metadata = {
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

/**
 * Homepage-level canonical and hreflang pairs. Deeper routes override this with
 * their own alternates via `buildLocalizedMetadata`.
 */
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const language = isStorefrontLanguage(locale) ? locale : "ar";
  const baseUrl = getSiteUrl();

  return {
    ...BASE_METADATA,
    alternates: {
      canonical: `${baseUrl}/${language}`,
      languages: Object.fromEntries(
        STOREFRONT_LANGUAGE_VALUES.map((alternate) => [alternate, `${baseUrl}/${alternate}`])
      )
    }
  };
}

/**
 * Root layout for the storefront.
 *
 * This is a root layout (it owns `<html>`/`<body>`) rather than a nested one, so
 * that `lang` and `dir` can come from the `[locale]` URL segment. The previous
 * shared `app/layout.tsx` had to read `cookies()` and `headers()` to work out the
 * language and whether it was serving the admin, and those two dynamic reads
 * opted every storefront route out of static rendering — which is what made
 * navigation slow. The admin now has its own root layout in `app/(payload)`.
 */
export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isStorefrontLanguage(locale)) {
    notFound();
  }

  const language = locale as StorefrontLanguage;

  return (
    <html lang={getStorefrontHtmlLang(language)} dir={getStorefrontDirection(language)}>
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
        <AppShell initialLanguage={language}>{children}</AppShell>
      </body>
    </html>
  );
}
