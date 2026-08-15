"use client";

import { type ReactNode } from "react";
import { useParams } from "next/navigation";
import { getStrictContext } from "@/lib/get-strict-context";
import {
  getStorefrontDirection,
  normalizeStorefrontLanguage,
  type StorefrontLanguage
} from "@/lib/storefront-language";

type StorefrontLanguageContextValue = {
  direction: "ltr" | "rtl";
  language: StorefrontLanguage;
  // Kept for API compatibility; switching is now done via URL navigation in language-switcher.tsx
  setLanguage: (language: StorefrontLanguage) => void;
};

const [StorefrontLanguageContextProvider, useStorefrontLanguage] =
  getStrictContext<StorefrontLanguageContextValue>("StorefrontLanguageProvider");

export { useStorefrontLanguage };

export function StorefrontLanguageProvider({
  children,
  initialLanguage
}: {
  children: ReactNode;
  initialLanguage: StorefrontLanguage;
}) {
  const params = useParams();
  // Prefer URL-derived locale; fall back to the server-rendered initialLanguage
  const localeFromUrl = params?.locale as string | undefined;
  const language = normalizeStorefrontLanguage(localeFromUrl ?? initialLanguage);

  return (
    <StorefrontLanguageContextProvider
      value={{
        direction: getStorefrontDirection(language),
        language,
        setLanguage: () => {
          // Language switching is handled by LanguageSwitcher via router.push
        }
      }}
    >
      {children}
    </StorefrontLanguageContextProvider>
  );
}
