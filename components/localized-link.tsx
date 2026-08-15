"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ComponentProps } from "react";
import { STOREFRONT_LANGUAGE_VALUES } from "@/lib/storefront-language";

type LocalizedLinkProps = ComponentProps<typeof Link>;

const KNOWN_LOCALES = new Set(STOREFRONT_LANGUAGE_VALUES as readonly string[]);

function isExternalHref(href: string): boolean {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  );
}

function alreadyHasLocale(href: string): boolean {
  const firstSegment = href.split("/")[1];
  return KNOWN_LOCALES.has(firstSegment ?? "");
}

export default function LocalizedLink({ href, ...props }: LocalizedLinkProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";

  if (typeof href !== "string" || isExternalHref(href) || alreadyHasLocale(href)) {
    return <Link href={href} {...props} />;
  }

  const localizedHref = href === "/" ? `/${locale}` : `/${locale}${href}`;
  return <Link href={localizedHref} {...props} />;
}
