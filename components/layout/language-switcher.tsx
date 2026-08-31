"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import FlagIcon, { LANGUAGE_A11Y_LABELS } from "@/components/layout/flag-icons";
import {
  STOREFRONT_LANGUAGE_VALUES,
  STOREFRONT_LANGUAGE_COOKIE,
  type StorefrontLanguage
} from "@/lib/storefront-language";

export default function LanguageSwitcher() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const currentLocale = (params?.locale as StorefrontLanguage) ?? "ar";

  const switchLocale = (nextLocale: StorefrontLanguage) => {
    if (nextLocale === currentLocale) return;

    // Swap the locale segment in the pathname: /ar/products -> /fr/products
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    const newPath = segments.join("/");
    // Read from the live URL rather than `useSearchParams`. This switcher sits in
    // the navbar on every page, and a render-time search-param read would opt
    // every storefront route out of prerendering — the query string is only
    // needed at click time, so reading it here costs nothing and keeps
    // `?category=` on the products page when the language changes.
    const search = window.location.search;
    const target = `${newPath}${search}`;

    // Sync cookie for server reads
    document.cookie = `${STOREFRONT_LANGUAGE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;

    startTransition(() => {
      router.push(target);
    });
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={LANGUAGE_A11Y_LABELS[currentLocale]}
        disabled={isPending}
        className="pointer-events-auto relative flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white shadow-[0_4px_24px_rgb(0,0,0,0.12)] outline-none transition-all duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-amber-400 disabled:cursor-wait"
      >
        <span className="block h-[26px] w-[26px] overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgb(0,0,0,0.08)]">
          <FlagIcon language={currentLocale} className="h-full w-full" />
        </span>
        {isPending ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
            <Loader2 className="h-4 w-4 animate-spin text-slate-700" />
          </span>
        ) : null}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="center"
          sideOffset={8}
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-[120] flex w-[50px] flex-col items-center gap-1.5 rounded-full bg-white p-1.5 shadow-[0_4px_24px_rgb(0,0,0,0.12)]"
        >
          {STOREFRONT_LANGUAGE_VALUES.map((locale) => {
            const isActive = locale === currentLocale;

            return (
              <DropdownMenu.Item
                key={locale}
                aria-label={LANGUAGE_A11Y_LABELS[locale]}
                textValue={LANGUAGE_A11Y_LABELS[locale]}
                onSelect={() => switchLocale(locale)}
                className={cn(
                  "flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full outline-none transition-colors data-[highlighted]:bg-slate-100",
                  isActive && "bg-amber-100 data-[highlighted]:bg-amber-100"
                )}
              >
                <span
                  className={cn(
                    "block h-[26px] w-[26px] overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgb(0,0,0,0.08)]",
                    isActive && "ring-2 ring-amber-400 ring-offset-1 ring-offset-white"
                  )}
                >
                  <FlagIcon language={locale} className="h-full w-full" />
                </span>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
