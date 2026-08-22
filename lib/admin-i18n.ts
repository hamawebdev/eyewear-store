import type { PayloadRequest } from "payload";

/**
 * Languages the Payload admin interface is offered in.
 *
 * Deliberately narrower than the storefront: the shop ships Arabic as well, but the
 * back office is French/English only. Arabic stays a *content* language here — the
 * `*Ar` fields keep collecting Arabic copy regardless of the admin UI language.
 */
export const ADMIN_LANGUAGES = ["fr", "en"] as const;

export type AdminLanguage = (typeof ADMIN_LANGUAGES)[number];

export const DEFAULT_ADMIN_LANGUAGE: AdminLanguage = "fr";

/** Payload reads the admin UI language from this cookie (`${cookiePrefix}-lng`). */
export const ADMIN_LANGUAGE_COOKIE = "payload-lng";

export const isAdminLanguage = (value: unknown): value is AdminLanguage =>
  typeof value === "string" && ADMIN_LANGUAGES.includes(value as AdminLanguage);

export const normalizeAdminLanguage = (value: unknown): AdminLanguage =>
  isAdminLanguage(value) ? value : DEFAULT_ADMIN_LANGUAGE;

/**
 * A label, description or option name rendered by the admin, in every admin language.
 * Payload accepts `Record<string, string>` anywhere it accepts a static label.
 */
export type AdminText = Record<AdminLanguage, string>;

/**
 * Translations for strings this project owns. Payload deep-merges these over its own
 * language packs, so `req.t("herizi:...")` resolves them server-side inside hooks.
 */
export const adminTranslations = {
  en: {
    herizi: {
      error: {
        arabicRequired: "An Arabic {{field}} is required.",
        arabicRequiredWithFrench:
          "An Arabic {{field}} is required when the French {{field}} is set.",
        categoryInUse: "This category is still assigned to one or more products.",
        categoryNameRequired: "A category name is required.",
        categorySlugSource: "A valid category name is required to generate a slug.",
        optionsRequireDefault: "Option pricing requires exactly one default option.",
        optionsRequireOne: "Option pricing requires at least one option.",
        productSlugSource: "A valid product name is required to generate a slug.",
        simplePriceRequired: "Simple pricing requires a product price."
      },
      field: {
        categoryCollectionLabel: "category collection label",
        categoryDescription: "category description",
        categoryHeadline: "category headline",
        categoryName: "category name",
        productBadge: "product badge",
        productDescription: "product description",
        productFeature: "product feature",
        productName: "product name",
        productOptionLabel: "product option label"
      }
    }
  },
  fr: {
    herizi: {
      error: {
        arabicRequired: "Le champ {{field}} en arabe est obligatoire.",
        arabicRequiredWithFrench:
          "Le champ {{field}} en arabe est obligatoire dès que la version française est renseignée.",
        categoryInUse: "Cette catégorie est encore associée à un ou plusieurs produits.",
        categoryNameRequired: "Le nom de la catégorie est obligatoire.",
        categorySlugSource: "Un nom de catégorie valide est nécessaire pour générer le slug.",
        optionsRequireDefault:
          "La tarification par options exige exactement une option par défaut.",
        optionsRequireOne: "La tarification par options exige au moins une option.",
        productSlugSource: "Un nom de produit valide est nécessaire pour générer le slug.",
        simplePriceRequired: "La tarification simple exige un prix de produit."
      },
      field: {
        categoryCollectionLabel: "libellé de collection",
        categoryDescription: "description de la catégorie",
        categoryHeadline: "titre de la catégorie",
        categoryName: "nom de la catégorie",
        productBadge: "badge du produit",
        productDescription: "description du produit",
        productFeature: "caractéristique du produit",
        productName: "nom du produit",
        productOptionLabel: "libellé d'option"
      }
    }
  }
} as const;

type Namespace = (typeof adminTranslations)["en"]["herizi"];

export type AdminErrorKey = `herizi:error:${keyof Namespace["error"]}`;
export type AdminFieldKey = `herizi:field:${keyof Namespace["field"]}`;

/**
 * Translate one of our own keys using the language of the current request.
 *
 * `req.t` is typed against Payload's built-in key union only, so custom namespaces
 * need the cast. The runtime lookup is the same one Payload uses for its own keys.
 */
export const tAdmin = (
  req: PayloadRequest,
  key: AdminErrorKey | AdminFieldKey,
  vars?: Record<string, unknown>
): string => {
  const translate = req.t as unknown as (
    key: string,
    vars?: Record<string, unknown>
  ) => string;

  return translate(key, vars);
};
