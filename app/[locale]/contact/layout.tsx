import { normalizeStorefrontLanguage } from "@/lib/storefront-language";
import type React from "react";
import type { Metadata } from "next";
import { buildLocalizedMetadata } from "@/lib/seo";
import { getStorefrontCopy } from "@/lib/storefront-copy";

// The contact page itself is a client component, so its metadata lives here.
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const language = normalizeStorefrontLanguage(locale);
  const copy = getStorefrontCopy(language);

  return buildLocalizedMetadata({
    description: copy.contact.intro,
    language,
    path: "/contact",
    title: copy.contact.title
  });
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
