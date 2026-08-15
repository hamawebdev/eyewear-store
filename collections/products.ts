import type { CollectionBeforeValidateHook, CollectionConfig, PayloadRequest } from "payload";
import { slugifyText } from "@/lib/slug";
import { FRAME_COLORS, FRAME_SHAPES, GENDERS, toSelectOptions } from "@/lib/eyewear";
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
  fieldLabel,
  french,
  required = false
}: {
  arabic: unknown;
  fieldLabel: string;
  french?: unknown;
  required?: boolean;
}) => {
  const arabicValue = getTrimmedString(arabic);
  const frenchValue = getTrimmedString(french);

  if (required && !arabicValue) {
    throw new Error(`An Arabic ${fieldLabel} is required.`);
  }

  if (frenchValue && !arabicValue) {
    throw new Error(`An Arabic ${fieldLabel} is required when the French ${fieldLabel} is set.`);
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
    throw new Error("A valid product name is required to generate a slug.");
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
    fieldLabel: "product name",
    french: productName,
    required: true
  });
  const productNameEn = getTrimmedString(nextData.nameEn ?? originalDoc?.nameEn);
  const productBadge = getTrimmedString(nextData.badge) ?? getTrimmedString(originalDoc?.badge);
  const productBadgeAr = assertArabicValue({
    arabic: nextData.badgeAr ?? originalDoc?.badgeAr,
    fieldLabel: "product badge",
    french: productBadge
  });
  const productBadgeEn = getTrimmedString(nextData.badgeEn ?? originalDoc?.badgeEn);
  const productDescription =
    getTrimmedString(nextData.description) ?? getTrimmedString(originalDoc?.description);
  const productDescriptionAr = assertArabicValue({
    arabic: nextData.descriptionAr ?? originalDoc?.descriptionAr,
    fieldLabel: "product description",
    french: productDescription
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
      fieldLabel: "product feature",
      french: text,
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
      throw new Error("Simple pricing requires a product price.");
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
        fieldLabel: "product option label",
        french: label,
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
      throw new Error("Option pricing requires at least one option.");
    }

    const defaultOptions = options.filter((option: ProductOptionInput) => option.isDefault);

    if (defaultOptions.length !== 1) {
      throw new Error("Option pricing requires exactly one default option.");
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
    beforeValidate: [syncProductPricing]
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          label: "French name",
          required: true,
          admin: {
            width: "33%"
          }
        },
        {
          name: "nameAr",
          type: "text",
          label: "Arabic name",
          required: true,
          admin: {
            width: "33%"
          }
        },
        {
          name: "nameEn",
          type: "text",
          label: "English name",
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
      admin: {
        description: "Automatically generated from the product name and kept stable after create.",
        position: "sidebar",
        readOnly: true
      }
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      required: true
    },
    {
      type: "row",
      fields: [
        {
          name: "frameShape",
          type: "select",
          options: toSelectOptions(FRAME_SHAPES),
          admin: {
            description: "Drives the storefront frame-shape filter.",
            width: "33%"
          }
        },
        {
          name: "gender",
          type: "select",
          options: toSelectOptions(GENDERS),
          admin: {
            width: "33%"
          }
        },
        {
          name: "frameColor",
          type: "select",
          options: toSelectOptions(FRAME_COLORS),
          admin: {
            description: "The dominant frame colour. Per-variant colours live in the options list.",
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
          label: "French badge",
          admin: {
            width: "33%"
          }
        },
        {
          name: "badgeAr",
          type: "text",
          label: "Arabic badge",
          admin: {
            description: "Required whenever the French badge is filled.",
            width: "33%"
          }
        },
        {
          name: "badgeEn",
          type: "text",
          label: "English badge",
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
          admin: {
            description: "Derived automatically from approved product reviews.",
            readOnly: true
          }
        },
        {
          name: "reviews",
          type: "number",
          defaultValue: 0,
          required: true,
          min: 0,
          admin: {
            description: "Derived automatically from approved product reviews.",
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
          label: "French description",
          admin: {
            width: "33%"
          }
        },
        {
          name: "descriptionAr",
          type: "textarea",
          label: "Arabic description",
          admin: {
            description: "Required whenever the French description is filled.",
            width: "33%"
          }
        },
        {
          name: "descriptionEn",
          type: "textarea",
          label: "English description",
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
      admin: {
        description: "Optional product image. When empty, the storefront falls back to a placeholder."
      }
    },
    {
      name: "gallery",
      type: "relationship",
      relationTo: "media",
      hasMany: true
    },
    {
      name: "artboardImage",
      type: "relationship",
      relationTo: "media",
      admin: {
        description:
          "Optional product-specific artboard image shown in the detail page highlight area."
      }
    },
    {
      name: "features",
      type: "array",
      fields: [
        {
          name: "text",
          type: "text",
          label: "French text",
          required: true
        },
        {
          name: "textAr",
          type: "text",
          label: "Arabic text",
          required: true
        },
        {
          name: "textEn",
          type: "text",
          label: "English text"
        }
      ]
    },
    {
      name: "featuredRank",
      type: "number",
      min: 1,
      admin: {
        description: "Lower numbers appear first in homepage and featured merchandising.",
        position: "sidebar"
      }
    },
    {
      name: "defaultStockType",
      type: "text",
      admin: {
        description: "Default stock type copied into new order records.",
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
          admin: {
            description: "Per-unit shipping weight used to prefill order parcels.",
            width: "33%"
          }
        },
        {
          name: "defaultDeclaredValue",
          type: "number",
          min: 0,
          admin: {
            description: "Optional declared value copied into order defaults.",
            width: "33%"
          }
        },
        {
          name: "defaultFragile",
          type: "checkbox",
          label: "Fragile by default",
          admin: {
            width: "34%"
          }
        }
      ]
    },
    {
      name: "defaultInsuranceEnabled",
      type: "checkbox",
      label: "Insurance enabled by default",
      admin: {
        position: "sidebar"
      }
    },
    {
      name: "pricingMode",
      type: "radio",
      defaultValue: "simple",
      options: [
        {
          label: "Simple price",
          value: "simple"
        },
        {
          label: "Options",
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
          admin: {
            width: "50%"
          }
        },
        {
          name: "simpleOriginalPrice",
          type: "number",
          min: 0,
          admin: {
            width: "50%"
          }
        }
      ]
    },
    {
      name: "options",
      type: "array",
      admin: {
        condition: showOptionPricing
      },
      fields: [
        {
          name: "label",
          type: "text",
          label: "French label",
          required: true
        },
        {
          name: "labelAr",
          type: "text",
          label: "Arabic label",
          required: true
        },
        {
          name: "labelEn",
          type: "text",
          label: "English label"
        },
        {
          name: "price",
          type: "number",
          required: true,
          min: 0
        },
        {
          name: "originalPrice",
          type: "number",
          min: 0
        },
        {
          name: "isDefault",
          type: "checkbox",
          label: "Default option"
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
          admin: {
            description: "Synced automatically from the simple price or the default option.",
            position: "sidebar",
            readOnly: true
          }
        },
        {
          name: "displayOriginalPrice",
          type: "number",
          admin: {
            position: "sidebar",
            readOnly: true
          }
        }
      ]
    }
  ]
};
