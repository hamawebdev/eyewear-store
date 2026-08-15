import type { Metadata } from "next";
import { BRAND, getSiteUrl } from "@/lib/brand";
import { STOREFRONT_LANGUAGE_VALUES, type StorefrontLanguage } from "@/lib/storefront-language";

/**
 * Builds per-page metadata with the canonical URL and the hreflang alternates
 * for the other two locales. `path` is the locale-less route, e.g. "/products".
 */
export const buildLocalizedMetadata = ({
  description,
  language,
  path,
  title
}: {
  description?: string;
  language: StorefrontLanguage;
  path: string;
  title: string;
}): Metadata => {
  const baseUrl = getSiteUrl();

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${language}${path}`,
      languages: Object.fromEntries(
        STOREFRONT_LANGUAGE_VALUES.map((alternate) => [`${alternate}`, `${baseUrl}/${alternate}${path}`])
      )
    },
    openGraph: {
      title: `${title} | ${BRAND.name}`,
      description,
      type: "website",
      url: `${baseUrl}/${language}${path}`
    }
  };
};
