import type React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { getSiteUrl } from "@/lib/brand";
import {
  isStorefrontLanguage,
  STOREFRONT_LANGUAGE_VALUES,
  type StorefrontLanguage
} from "@/lib/storefront-language";

export function generateStaticParams() {
  return STOREFRONT_LANGUAGE_VALUES.map((locale) => ({ locale }));
}

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
    alternates: {
      canonical: `${baseUrl}/${language}`,
      languages: Object.fromEntries(
        STOREFRONT_LANGUAGE_VALUES.map((alternate) => [alternate, `${baseUrl}/${alternate}`])
      )
    }
  };
}

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

  return <AppShell initialLanguage={locale as StorefrontLanguage}>{children}</AppShell>;
}
