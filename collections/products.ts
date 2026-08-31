import type { CollectionBeforeValidateHook, CollectionConfig, PayloadRequest } from "payload";
import { revalidateProducts } from "./hooks/revalidateStorefront";
import { slugifyText } from "@/lib/slug";
import {
  FRAME_COLOR_LABELS_FR,
  FRAME_COLORS,
  FRAME_SHAPE_LABELS_FR,
  FRAME_SHAPES,
  GENDER_LABELS_FR,
  GENDERS,
  toSelectOptions
} from "@/lib/eyewear";
import { tAdmin, type AdminFieldKey } from "@/lib/admin-i18n";
import { isAdmin } from "./access";

type ProductOptionInput = {
  id?: string;
  isDefault?: boolean;
  label?: string;
  labelAr?: string;
  labelEn?: string;
  originalPrice?: null | number;
  price?: null | number;
};

type ProductFeatureInput = {
  text?: string;
  textAr?: string;
  textEn?: string;
};

type ProductDocument = {
  artboardImage?: number | string | null;
  badge?: string | null;
  badgeAr?: string | null;
  badgeEn?: string | null;
  category?: { id: number | string } | number | string | null;
  description?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  features?: ProductFeatureInput[];
  frameColor?: null | string;
  frameShape?: null | string;
  gender?: null | string;
  id: number | string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  options?: ProductOptionInput[];
  pricingMode?: "options" | "simple";
  rating?: number;
  reviews?: number;
  simpleOriginalPrice?: null | number;
  simplePrice?: null | number;
  slug?: string;
};

type ProductInput = {
  artboardImage?: null | number | string;
  badge?: null | string;
  badgeAr?: null | string;
  badgeEn?: null | string;
  category?: null | number | string;
  description?: null | string;
  descriptionAr?: null | string;
  descriptionEn?: null | string;
  displayOriginalPrice?: null | number;
  displayPrice?: null | number;
  featuredRank?: null | number;
  features?: ProductFeatureInput[];
  frameColor?: null | string;
  frameShape?: null | string;
  gender?: null | string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  options?: ProductOptionInput[];
  pricingMode?: "options" | "simple";
  reviews?: number;
  simpleOriginalPrice?: null | number;
  simplePrice?: null | number;
  slug?: string;
  rating?: number;
};

const DERIVED_REVIEW_SUMMARY_CONTEXT_KEY = "syncDerivedReviewSummary";

const getTrimmedString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const assertArabicValue = ({
  arabic,
  fieldKey,
  french,
  req,
  required = false
}: {
  arabic: unknown;
  fieldKey: AdminFieldKey;
  french?: unknown;
  req: PayloadRequest;
  required?: boolean;
}) => {
  const arabicValue = getTrimmedString(arabic);
  const frenchValue = getTrimmedString(french);
  const field = tAdmin(req, fieldKey);

  if (required && !arabicValue) {
    throw new Error(tAdmin(req, "herizi:error:arabicRequired", { field }));
  }

  if (frenchValue && !arabicValue) {
    throw new Error(tAdmin(req, "herizi:error:arabicRequiredWithFrench", { field }));
  }

  return arabicValue;
};

const toPositiveNumber = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return undefined;
  }

  return value;
};

const toReviewCount = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return 0;
  }

  return Math.round(value);
};

const toReviewRating = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return 0;
  }

  return Number(Math.min(5, Math.max(0, value)).toFixed(1));
};

const getPricingMode = (siblingData: unknown) =>
  typeof siblingData === "object" &&
  siblingData !== null &&
  "pricingMode" in siblingData &&
  typeof siblingData.pricingMode === "string"
    ? siblingData.pricingMode
    : undefined;

const showSimplePricing = (_data: unknown, siblingData: unknown) =>
  getPricingMode(siblingData) === "simple";

const showOptionPricing = (_data: unknown, siblingData: unknown) =>
  getPricingMode(siblingData) === "options";

const buildUniqueSlug = async ({
  name,
  originalDoc,
  req,
  requestedSlug
}: {
  name: string;
  originalDoc?: ProductDocument;
  req: PayloadRequest;
  requestedSlug?: null | string;
}) => {
  if (originalDoc?.slug?.trim()) {
    return originalDoc.slug.trim();
  }

  // An explicit slug supplied on create wins, so seed data can own the URL.
  const baseSlug = slugifyText(getTrimmedString(requestedSlug) ?? name);

  if (!baseSlug) {
    throw new Error(tAdmin(req, "herizi:error:productSlugSource"));
  }

  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const result = await req.payload.find({
      collection: "products",
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        slug: {
          equals: candidate
        }
      }
    });

    const existingProduct = result.docs[0] as ProductDocument | undefined;

    if (!existingProduct) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

const syncProductPricing: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const nextData: ProductInput = { ...(data ?? {}) };
  const productName =
    getTrimmedString(nextData.name) ?? getTrimmedString(originalDoc?.name);
  const productNameAr = assertArabicValue({
    arabic: nextData.nameAr ?? originalDoc?.nameAr,
    fieldKey: "herizi:field:productName",
    french: productName,
    req,
    required: true
  });
  const productNameEn = getTrimmedString(nextData.nameEn ?? originalDoc?.nameEn);
  const productBadge = getTrimmedString(nextData.badge) ?? getTrimmedString(originalDoc?.badge);
  const productBadgeAr = assertArabicValue({
    arabic: nextData.badgeAr ?? originalDoc?.badgeAr,
    fieldKey: "herizi:field:productBadge",
    french: productBadge,
    req
  });
  const productBadgeEn = getTrimmedString(nextData.badgeEn ?? originalDoc?.badgeEn);
  const productDescription =
    getTrimmedString(nextData.description) ?? getTrimmedString(originalDoc?.description);
  const productDescriptionAr = assertArabicValue({
    arabic: nextData.descriptionAr ?? originalDoc?.descriptionAr,
    fieldKey: "herizi:field:productDescription",
    french: productDescription,
    req
  });
  const productDescriptionEn = getTrimmedString(nextData.descriptionEn ?? originalDoc?.descriptionEn);

  nextData.name = productName;
  nextData.nameAr = productNameAr;
  nextData.nameEn = productNameEn;
  nextData.badge = productBadge;
  nextData.badgeAr = productBadgeAr;
  nextData.badgeEn = productBadgeEn;
  nextData.description = productDescription;
  nextData.descriptionAr = productDescriptionAr;
  nextData.descriptionEn = productDescriptionEn;

  const sourceFeatures: ProductFeatureInput[] = Array.isArray(nextData.features)
    ? nextData.features
    : Array.isArray(originalDoc?.features)
      ? originalDoc.features
      : [];

  nextData.features = sourceFeatures.reduce<ProductFeatureInput[]>((validFeatures, feature) => {
    const text = getTrimmedString(feature.text);

    if (!text) {
      return validFeatures;
    }

    const textAr = assertArabicValue({
      arabic: feature.textAr,
      fieldKey: "herizi:field:productFeature",
      french: text,
      req,
      required: true
    });
    const textEn = getTrimmedString(feature.textEn);

    validFeatures.push({
      ...feature,
      text,
      textAr,
      textEn
    });

    return validFeatures;
  }, []);

  if (productName) {
    nextData.slug = await buildUniqueSlug({
      name: productName,
      originalDoc: originalDoc as ProductDocument | undefined,
      req,
      requestedSlug: nextData.slug
    });
  }

  const shouldSyncDerivedReviewSummary = Boolean(req.context?.[DERIVED_REVIEW_SUMMARY_CONTEXT_KEY]);

  if (shouldSyncDerivedReviewSummary) {
    nextData.rating = toReviewRating(nextData.rating ?? originalDoc?.rating);
    nextData.reviews = toReviewCount(nextData.reviews ?? originalDoc?.reviews);
  } else {
    nextData.rating = toReviewRating(originalDoc?.rating);
    nextData.reviews = toReviewCount(originalDoc?.reviews);
  }

  const pricingMode = nextData.pricingMode ?? originalDoc?.pricingMode;

  if (pricingMode === "simple") {
    const simplePrice = toPositiveNumber(nextData.simplePrice ?? originalDoc?.simplePrice);

    if (!simplePrice) {
      throw new Error(tAdmin(req, "herizi:error:simplePriceRequired"));
    }

    nextData.displayPrice = simplePrice;
    nextData.displayOriginalPrice = toPositiveNumber(
      nextData.simpleOriginalPrice ?? originalDoc?.simpleOriginalPrice
    );
    nextData.options = [];

    return nextData;
  }

  if (pricingMode === "options") {
    const sourceOptions: ProductOptionInput[] = Array.isArray(nextData.options)
      ? nextData.options
      : Array.isArray(originalDoc?.options)
        ? originalDoc.options
        : [];
    const options = sourceOptions.reduce<
      Array<ProductOptionInput & { label: string; labelAr: string; price: number }>
    >((validOptions, option) => {
      const label = getTrimmedString(option.label);
      const price = toPositiveNumber(option.price);

      if (!label || !price) {
        return validOptions;
      }

      const labelAr = assertArabicValue({
        arabic: option.labelAr,
        fieldKey: "herizi:field:productOptionLabel",
        french: label,
        req,
        required: true
      }) ?? label;
      const labelEn = getTrimmedString(option.labelEn) ?? label;

      validOptions.push({
        ...option,
        label,
        labelAr,
        labelEn,
        originalPrice: toPositiveNumber(option.originalPrice),
        price
      });

      return validOptions;
    }, []);

    if (options.length === 0) {
      throw new Error(tAdmin(req, "herizi:error:optionsRequireOne"));
    }

    const defaultOptions = options.filter((option: ProductOptionInput) => option.isDefault);

    if (defaultOptions.length !== 1) {
      throw new Error(tAdmin(req, "herizi:error:optionsRequireDefault"));
    }

    const defaultOption = defaultOptions[0];

    nextData.options = options;
    nextData.displayPrice = defaultOption.price;
    nextData.displayOriginalPrice = defaultOption.originalPrice;
    nextData.simplePrice = undefined;
    nextData.simpleOriginalPrice = undefined;

    return nextData;
  }

  return nextData;
};

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    plural: { en: "Products", fr: "Produits" },
    singular: { en: "Product", fr: "Produit" }
  },
  admin: {
    defaultColumns: [
      "name",
      "category",
      "pricingMode",
      "displayPrice",
      "rating",
      "reviews",
      "updatedAt"
    ],
    useAsTitle: "name"
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true,
    update: isAdmin
  },
  hooks: {
    afterChange: [revalidateProducts],
    afterDelete: [revalidateProducts],
    beforeValidate: [syncProductPricing]
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          label: { en: "French name", fr: "Nom (français)" },
          required: true,
          admin: {
            width: "33%"
          }
        },
        {
          name: "nameAr",
          type: "text",
          label: { en: "Arabic name", fr: "Nom (arabe)" },
          required: true,
          admin: {
            width: "33%"
          }
        },
        {
          name: "nameEn",
          type: "text",
          label: { en: "English name", fr: "Nom (anglais)" },
          admin: {
            width: "34%"
          }
        }
      ]
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: { en: "Slug", fr: "Slug" },
      admin: {
        description: {
          en: "Automatically generated from the product name and kept stable after create.",
          fr: "Généré automatiquement à partir du nom du produit et conservé tel quel après la création."
        },
        position: "sidebar",
        readOnly: true
      }
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      required: true,
      label: { en: "Category", fr: "Catégorie" }
    },
    {
      type: "row",
      fields: [
        {
          name: "frameShape",
          type: "select",
          label: { en: "Frame shape", fr: "Forme de la monture" },
          options: toSelectOptions(FRAME_SHAPES, FRAME_SHAPE_LABELS_FR),
          admin: {
            description: {
              en: "Drives the storefront frame-shape filter.",
              fr: "Alimente le filtre « forme de monture » de la boutique."
            },
            width: "33%"
          }
        },
        {
          name: "gender",
          type: "select",
          label: { en: "Gender", fr: "Genre" },
          options: toSelectOptions(GENDERS, GENDER_LABELS_FR),
          admin: {
            width: "33%"
          }
        },
        {
          name: "frameColor",
          type: "select",
          label: { en: "Frame colour", fr: "Couleur de la monture" },
          options: toSelectOptions(FRAME_COLORS, FRAME_COLOR_LABELS_FR),
          admin: {
            description: {
              en: "The dominant frame colour. Per-variant colours live in the options list.",
              fr: "La couleur dominante de la monture. Les couleurs par variante se règlent dans la liste des options."
            },
            width: "34%"
          }
        }
      ]
    },
    {
      type: "row",
      fields: [
        {
          name: "badge",
          type: "text",
          label: { en: "French badge", fr: "Badge (français)" },
          admin: {
            width: "33%"
          }
        },
        {
          name: "badgeAr",
          type: "text",
          label: { en: "Arabic badge", fr: "Badge (arabe)" },
          admin: {
            description: {
              en: "Required whenever the French badge is filled.",
              fr: "Obligatoire dès que le badge français est renseigné."
            },
            width: "33%"
          }
        },
        {
          name: "badgeEn",
          type: "text",
          label: { en: "English badge", fr: "Badge (anglais)" },
          admin: {
            width: "34%"
          }
        }
      ]
    },
    {
      type: "row",
      fields: [
        {
          name: "rating",
          type: "number",
          defaultValue: 0,
          required: true,
          min: 0,
          max: 5,
          label: { en: "Rating", fr: "Note" },
          admin: {
            description: {
              en: "Derived automatically from approved product reviews.",
              fr: "Calculée automatiquement à partir des avis approuvés."
            },
            readOnly: true
          }
        },
        {
          name: "reviews",
          type: "number",
          defaultValue: 0,
          required: true,
          min: 0,
          label: { en: "Reviews", fr: "Nombre d'avis" },
          admin: {
            description: {
              en: "Derived automatically from approved product reviews.",
              fr: "Calculé automatiquement à partir des avis approuvés."
            },
            readOnly: true
          }
        }
      ]
    },
    {
      type: "row",
      fields: [
        {
          name: "description",
          type: "textarea",
          label: { en: "French description", fr: "Description (français)" },
          admin: {
            width: "33%"
          }
        },
        {
          name: "descriptionAr",
          type: "textarea",
          label: { en: "Arabic description", fr: "Description (arabe)" },
          admin: {
            description: {
              en: "Required whenever the French description is filled.",
              fr: "Obligatoire dès que la description française est renseignée."
            },
            width: "33%"
          }
        },
        {
          name: "descriptionEn",
          type: "textarea",
          label: { en: "English description", fr: "Description (anglais)" },
          admin: {
            width: "34%"
          }
        }
      ]
    },
    {
      name: "primaryImage",
      type: "relationship",
      relationTo: "media",
      label: { en: "Primary image", fr: "Image principale" },
      admin: {
        description: {
          en: "Optional product image. When empty, the storefront falls back to a placeholder.",
          fr: "Image du produit, facultative. Si elle est vide, la boutique affiche une image de remplacement."
        }
      }
    },
    {
      name: "gallery",
      type: "relationship",
      relationTo: "media",
      hasMany: true,
      label: { en: "Gallery", fr: "Galerie" }
    },
    {
      name: "artboardImage",
      type: "relationship",
      relationTo: "media",
      label: { en: "Artboard image", fr: "Image d'artboard" },
      admin: {
        description: {
          en: "Optional product-specific artboard image shown in the detail page highlight area.",
          fr: "Image d'artboard propre au produit, affichée dans la zone de mise en avant de la fiche produit. Facultative."
        }
      }
    },
    {
      name: "features",
      type: "array",
      label: { en: "Features", fr: "Caractéristiques" },
      fields: [
        {
          name: "text",
          type: "text",
          label: { en: "French text", fr: "Texte (français)" },
          required: true
        },
        {
          name: "textAr",
          type: "text",
          label: { en: "Arabic text", fr: "Texte (arabe)" },
          required: true
        },
        {
          name: "textEn",
          type: "text",
          label: { en: "English text", fr: "Texte (anglais)" }
        }
      ]
    },
    {
      name: "featuredRank",
      type: "number",
      min: 1,
      label: { en: "Featured rank", fr: "Rang de mise en avant" },
      admin: {
        description: {
          en: "Lower numbers appear first in homepage and featured merchandising.",
          fr: "Les valeurs les plus basses apparaissent en premier sur la page d'accueil et dans les mises en avant."
        },
        position: "sidebar"
      }
    },
    {
      name: "defaultStockType",
      type: "text",
      label: { en: "Default stock type", fr: "Type de stock par défaut" },
      admin: {
        description: {
          en: "Default stock type copied into new order records.",
          fr: "Type de stock recopié par défaut dans les nouvelles commandes."
        },
        position: "sidebar"
      }
    },
    {
      type: "row",
      fields: [
        {
          name: "defaultWeightGrams",
          type: "number",
          min: 0,
          label: { en: "Default weight (g)", fr: "Poids par défaut (g)" },
          admin: {
            description: {
              en: "Per-unit shipping weight used to prefill order parcels.",
              fr: "Poids d'expédition à l'unité, utilisé pour préremplir les colis."
            },
            width: "33%"
          }
        },
        {
          name: "defaultDeclaredValue",
          type: "number",
          min: 0,
          label: { en: "Default declared value", fr: "Valeur déclarée par défaut" },
          admin: {
            description: {
              en: "Optional declared value copied into order defaults.",
              fr: "Valeur déclarée facultative, recopiée dans les valeurs par défaut des commandes."
            },
            width: "33%"
          }
        },
        {
          name: "defaultFragile",
          type: "checkbox",
          label: { en: "Fragile by default", fr: "Fragile par défaut" },
          admin: {
            width: "34%"
          }
        }
      ]
    },
    {
      name: "defaultInsuranceEnabled",
      type: "checkbox",
      label: { en: "Insurance enabled by default", fr: "Assurance activée par défaut" },
      admin: {
        position: "sidebar"
      }
    },
    {
      name: "pricingMode",
      type: "radio",
      defaultValue: "simple",
      label: { en: "Pricing mode", fr: "Mode de tarification" },
      options: [
        {
          label: { en: "Simple price", fr: "Prix simple" },
          value: "simple"
        },
        {
          label: { en: "Options", fr: "Options" },
          value: "options"
        }
      ],
      required: true
    },
    {
      type: "row",
      admin: {
        condition: showSimplePricing
      },
      fields: [
        {
          name: "simplePrice",
          type: "number",
          min: 0,
          label: { en: "Simple price", fr: "Prix simple" },
          admin: {
            width: "50%"
          }
        },
        {
          name: "simpleOriginalPrice",
          type: "number",
          min: 0,
          label: { en: "Simple original price", fr: "Prix barré" },
          admin: {
            width: "50%"
          }
        }
      ]
    },
    {
      name: "options",
      type: "array",
      label: { en: "Options", fr: "Options" },
      admin: {
        condition: showOptionPricing
      },
      fields: [
        {
          name: "label",
          type: "text",
          label: { en: "French label", fr: "Libellé (français)" },
          required: true
        },
        {
          name: "labelAr",
          type: "text",
          label: { en: "Arabic label", fr: "Libellé (arabe)" },
          required: true
        },
        {
          name: "labelEn",
          type: "text",
          label: { en: "English label", fr: "Libellé (anglais)" }
        },
        {
          name: "price",
          type: "number",
          required: true,
          min: 0,
          label: { en: "Price", fr: "Prix" }
        },
        {
          name: "originalPrice",
          type: "number",
          min: 0,
          label: { en: "Original price", fr: "Prix barré" }
        },
        {
          name: "isDefault",
          type: "checkbox",
          label: { en: "Default option", fr: "Option par défaut" }
        }
      ]
    },
    {
      type: "row",
      fields: [
        {
          name: "displayPrice",
          type: "number",
          required: true,
          label: { en: "Display price", fr: "Prix affiché" },
          admin: {
            description: {
              en: "Synced automatically from the simple price or the default option.",
              fr: "Synchronisé automatiquement depuis le prix simple ou l'option par défaut."
            },
            position: "sidebar",
            readOnly: true
          }
        },
        {
          name: "displayOriginalPrice",
          type: "number",
          label: { en: "Display original price", fr: "Prix barré affiché" },
          admin: {
            position: "sidebar",
            readOnly: true
          }
        }
      ]
    }
  ]
};
