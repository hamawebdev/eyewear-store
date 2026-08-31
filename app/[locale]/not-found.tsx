"use client";

import LocalizedLink from "@/components/localized-link";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import { getStorefrontCopy } from "@/lib/storefront-copy";

/**
 * `not-found.tsx` cannot read route params, so the language comes from the
 * storefront provider that `app/[locale]/layout.tsx` already mounts — which is
 * also why this is a client component.
 */
export default function LocaleNotFound() {
  const { language } = useStorefrontLanguage();
  const copy = getStorefrontCopy(language).notFoundPage;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 py-24 text-center sm:px-6">
      <p className="font-spec text-muted-foreground text-[11px] tracking-[0.2em] uppercase">404</p>
      <h1 className="text-foreground text-3xl font-bold tracking-[-0.02em] text-balance sm:text-4xl">
        {copy.heading}
      </h1>
      <p className="font-body text-muted-foreground max-w-[46ch] text-[15px] leading-[1.7] text-pretty">
        {copy.body}
      </p>
      <LocalizedLink
        href="/products"
        className="text-foreground mt-2 underline-offset-4 hover:underline"
      >
        {copy.cta}
      </LocalizedLink>
    </main>
  );
}
