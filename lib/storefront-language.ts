import type { LocalizedText } from "@/lib/localized-text";

export const STOREFRONT_LANGUAGE_VALUES = ["ar", "fr", "en"] as const;
export type StorefrontLanguage = (typeof STOREFRONT_LANGUAGE_VALUES)[number];

export const DEFAULT_STOREFRONT_LANGUAGE: StorefrontLanguage = "ar";
export const STOREFRONT_LANGUAGE_COOKIE = "storefront-language";

export const isStorefrontLanguage = (value: unknown): value is StorefrontLanguage =>
  typeof value === "string" &&
  STOREFRONT_LANGUAGE_VALUES.includes(value as StorefrontLanguage);

export const normalizeStorefrontLanguage = (value: unknown): StorefrontLanguage =>
  isStorefrontLanguage(value) ? value : DEFAULT_STOREFRONT_LANGUAGE;

export const getStorefrontDirection = (language: StorefrontLanguage) =>
  language === "ar" ? "rtl" : "ltr";

export const getStorefrontLocale = (language: StorefrontLanguage) => {
  if (language === "ar") return "ar-DZ";
  if (language === "fr") return "fr-DZ";
  return "en-DZ";
};

export const getStorefrontHtmlLang = (language: StorefrontLanguage) => language;

export const buildLocalizedText = ({
  ar,
  fr,
  en
}: {
  ar?: null | string;
  fr?: null | string;
  en?: null | string;
}): LocalizedText => {
  const trimmedFr = typeof fr === "string" ? fr.trim() : "";
  const trimmedAr = typeof ar === "string" ? ar.trim() : "";
  const trimmedEn = typeof en === "string" ? en.trim() : "";
  const fallback = trimmedFr || trimmedAr || trimmedEn;

  return {
    ar: trimmedAr || fallback,
    fr: trimmedFr || fallback,
    en: trimmedEn || trimmedFr || fallback
  };
};

export const resolveLocalizedText = (
  value: LocalizedText | null | string | undefined,
  language: StorefrontLanguage
) => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (!value) {
    return "";
  }

  return (value[language] || value.fr || value.ar || value.en || "").trim();
};

export const formatStorefrontCurrency = (amount: number, language: StorefrontLanguage) =>
  `${new Intl.NumberFormat(getStorefrontLocale(language), {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(amount)} DZD`;
