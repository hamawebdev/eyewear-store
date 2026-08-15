import type {
  CollectionBeforeDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  PayloadRequest
} from "payload";
import { slugifyText } from "@/lib/slug";
import { isAdmin } from "./access";

type CategoryDocument = {
  id: number | string;
  description?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  headline?: string;
  headlineAr?: string;
  headlineEn?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  outlinedPill?: string;
  outlinedPillAr?: string;
  outlinedPillEn?: string;
  slug?: string;
};

type CategoryInput = {
  description?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  headline?: string;
  headlineAr?: string;
  headlineEn?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  outlinedPill?: string;
  outlinedPillAr?: string;
  outlinedPillEn?: string;
  slug?: string;
};

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

const buildUniqueSlug = async ({
  name,
  originalDoc,
  req,
  requestedSlug
}: {
  name: string;
  originalDoc?: CategoryDocument;
  req: PayloadRequest;
  requestedSlug?: null | string;
}) => {
  if (originalDoc?.slug?.trim()) {
    return originalDoc.slug.trim();
  }

  // An explicit slug supplied on create wins, so seed data can own the URL.
  const baseSlug = slugifyText(getTrimmedString(requestedSlug) ?? name);

  if (!baseSlug) {
    throw new Error("A valid category name is required to generate a slug.");
  }

  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const result = await req.payload.find({
      collection: "categories",
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        slug: {
          equals: candidate
        }
      }
    });

    const existingCategory = result.docs[0] as CategoryDocument | undefined;

    if (!existingCategory || existingCategory.id === originalDoc?.id) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

const syncCategorySlug: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const nextData = { ...(data ?? {}) } as CategoryInput;
  const categoryName =
    (typeof nextData.name === "string" && nextData.name.trim()) ||
    (typeof originalDoc?.name === "string" && originalDoc.name.trim());
  const categoryNameAr = assertArabicValue({
    arabic: nextData.nameAr ?? originalDoc?.nameAr,
    fieldLabel: "category name",
    french: categoryName,
    required: true
  });
  const categoryNameEn = getTrimmedString(nextData.nameEn ?? originalDoc?.nameEn);
  const categoryHeadline =
    getTrimmedString(nextData.headline) ?? getTrimmedString(originalDoc?.headline);
  const categoryHeadlineAr = assertArabicValue({
    arabic: nextData.headlineAr ?? originalDoc?.headlineAr,
    fieldLabel: "category headline",
    french: categoryHeadline,
    required: true
  });
  const categoryHeadlineEn = getTrimmedString(nextData.headlineEn ?? originalDoc?.headlineEn);
  const categoryOutlinedPill =
    getTrimmedString(nextData.outlinedPill) ?? getTrimmedString(originalDoc?.outlinedPill);
  const categoryOutlinedPillAr = assertArabicValue({
    arabic: nextData.outlinedPillAr ?? originalDoc?.outlinedPillAr,
    fieldLabel: "category outlined pill",
    french: categoryOutlinedPill,
    required: true
  });
  const categoryOutlinedPillEn = getTrimmedString(nextData.outlinedPillEn ?? originalDoc?.outlinedPillEn);
  const categoryDescription =
    getTrimmedString(nextData.description) ?? getTrimmedString(originalDoc?.description);
  const categoryDescriptionAr = assertArabicValue({
    arabic: nextData.descriptionAr ?? originalDoc?.descriptionAr,
    fieldLabel: "category description",
    french: categoryDescription,
    required: true
  });
  const categoryDescriptionEn = getTrimmedString(nextData.descriptionEn ?? originalDoc?.descriptionEn);

  if (!categoryName) {
    throw new Error("A category name is required.");
  }

  nextData.name = categoryName;
  nextData.nameAr = categoryNameAr;
  nextData.nameEn = categoryNameEn;
  nextData.headline = categoryHeadline;
  nextData.headlineAr = categoryHeadlineAr;
  nextData.headlineEn = categoryHeadlineEn;
  nextData.outlinedPill = categoryOutlinedPill;
  nextData.outlinedPillAr = categoryOutlinedPillAr;
  nextData.outlinedPillEn = categoryOutlinedPillEn;
  nextData.description = categoryDescription;
  nextData.descriptionAr = categoryDescriptionAr;
  nextData.descriptionEn = categoryDescriptionEn;
  nextData.slug = await buildUniqueSlug({
    name: categoryName,
    originalDoc: originalDoc as CategoryDocument | undefined,
    req,
    requestedSlug: nextData.slug
  });

  return nextData;
};

const blockCategoryDeleteWhenInUse: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const categoryDoc = (await req.payload.findByID({
    collection: "categories",
    depth: 0,
    id,
    overrideAccess: true
  })) as CategoryDocument;

  const categorySlug = categoryDoc.slug?.trim();
  const usageResult = await req.payload.find({
    collection: "products",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: categorySlug
      ? {
          or: [
            {
              category: {
                equals: id
              }
            },
            {
              category: {
                equals: categorySlug
              }
            }
          ]
        }
      : {
          category: {
            equals: id
          }
        }
  });

  if (usageResult.docs.length > 0) {
    throw new Error("This category is still assigned to one or more products.");
  }
};

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    defaultColumns: ["name", "slug", "sortOrder", "updatedAt"],
    useAsTitle: "name"
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true,
    update: isAdmin
  },
  defaultSort: "sortOrder",
  hooks: {
    beforeDelete: [blockCategoryDeleteWhenInUse],
    beforeValidate: [syncCategorySlug]
  },
  labels: {
    plural: "Categories",
    singular: "Category"
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
        description: "Automatically generated from the category name and kept stable after create.",
        position: "sidebar",
        readOnly: true
      }
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      required: true,
      admin: {
        description: "Lower numbers appear first on the storefront.",
        position: "sidebar"
      }
    },
    {
      name: "image",
      type: "relationship",
      relationTo: "media",
      admin: {
        description: "Optional storefront image. When empty, the storefront falls back to a placeholder."
      }
    },
    {
      name: "backgroundImage",
      type: "relationship",
      relationTo: "media",
      admin: {
        description:
          "Optional storefront background image. When empty, the storefront falls back to a placeholder."
      }
    },
    {
      name: "headline",
      type: "textarea",
      label: "French headline",
      required: true,
      admin: {
        description: "French spotlight heading. Supports manual line breaks."
      }
    },
    {
      name: "headlineAr",
      type: "textarea",
      label: "Arabic headline",
      required: true,
      admin: {
        description: "Arabic translation for the spotlight heading."
      }
    },
    {
      name: "headlineEn",
      type: "textarea",
      label: "English headline",
      admin: {
        description: "English translation for the spotlight heading."
      }
    },
    {
      name: "outlinedPill",
      type: "text",
      label: "French outlined pill",
      required: true,
      admin: {
        description: "French label for the outlined pill above the spotlight heading."
      }
    },
    {
      name: "outlinedPillAr",
      type: "text",
      label: "Arabic outlined pill",
      required: true,
      admin: {
        description: "Arabic translation for the outlined pill label."
      }
    },
    {
      name: "outlinedPillEn",
      type: "text",
      label: "English outlined pill",
      admin: {
        description: "English translation for the outlined pill label."
      }
    },
    {
      name: "description",
      type: "textarea",
      label: "French description",
      required: true,
      admin: {
        description: "French spotlight description."
      }
    },
    {
      name: "descriptionAr",
      type: "textarea",
      label: "Arabic description",
      required: true,
      admin: {
        description: "Arabic translation for the category spotlight description."
      }
    },
    {
      name: "descriptionEn",
      type: "textarea",
      label: "English description",
      admin: {
        description: "English translation for the category spotlight description."
      }
    }
  ]
};
