import type {
  CollectionBeforeDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  PayloadRequest
} from "payload";
import { revalidateCategories } from "./hooks/revalidateStorefront";
import { slugifyText } from "@/lib/slug";
import { tAdmin, type AdminFieldKey } from "@/lib/admin-i18n";
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
  collectionLabel?: string;
  collectionLabelAr?: string;
  collectionLabelEn?: string;
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
  collectionLabel?: string;
  collectionLabelAr?: string;
  collectionLabelEn?: string;
  slug?: string;
};

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
    throw new Error(tAdmin(req, "herizi:error:categorySlugSource"));
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
    fieldKey: "herizi:field:categoryName",
    french: categoryName,
    req,
    required: true
  });
  const categoryNameEn = getTrimmedString(nextData.nameEn ?? originalDoc?.nameEn);
  const categoryHeadline =
    getTrimmedString(nextData.headline) ?? getTrimmedString(originalDoc?.headline);
  const categoryHeadlineAr = assertArabicValue({
    arabic: nextData.headlineAr ?? originalDoc?.headlineAr,
    fieldKey: "herizi:field:categoryHeadline",
    french: categoryHeadline,
    req,
    required: true
  });
  const categoryHeadlineEn = getTrimmedString(nextData.headlineEn ?? originalDoc?.headlineEn);
  const categoryCollectionLabel =
    getTrimmedString(nextData.collectionLabel) ?? getTrimmedString(originalDoc?.collectionLabel);
  const categoryCollectionLabelAr = assertArabicValue({
    arabic: nextData.collectionLabelAr ?? originalDoc?.collectionLabelAr,
    fieldKey: "herizi:field:categoryCollectionLabel",
    french: categoryCollectionLabel,
    req,
    required: true
  });
  const categoryCollectionLabelEn = getTrimmedString(nextData.collectionLabelEn ?? originalDoc?.collectionLabelEn);
  const categoryDescription =
    getTrimmedString(nextData.description) ?? getTrimmedString(originalDoc?.description);
  const categoryDescriptionAr = assertArabicValue({
    arabic: nextData.descriptionAr ?? originalDoc?.descriptionAr,
    fieldKey: "herizi:field:categoryDescription",
    french: categoryDescription,
    req,
    required: true
  });
  const categoryDescriptionEn = getTrimmedString(nextData.descriptionEn ?? originalDoc?.descriptionEn);

  if (!categoryName) {
    throw new Error(tAdmin(req, "herizi:error:categoryNameRequired"));
  }

  nextData.name = categoryName;
  nextData.nameAr = categoryNameAr;
  nextData.nameEn = categoryNameEn;
  nextData.headline = categoryHeadline;
  nextData.headlineAr = categoryHeadlineAr;
  nextData.headlineEn = categoryHeadlineEn;
  nextData.collectionLabel = categoryCollectionLabel;
  nextData.collectionLabelAr = categoryCollectionLabelAr;
  nextData.collectionLabelEn = categoryCollectionLabelEn;
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
    throw new Error(tAdmin(req, "herizi:error:categoryInUse"));
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
    afterChange: [revalidateCategories],
    afterDelete: [revalidateCategories],
    beforeDelete: [blockCategoryDeleteWhenInUse],
    beforeValidate: [syncCategorySlug]
  },
  labels: {
    plural: { en: "Categories", fr: "Catégories" },
    singular: { en: "Category", fr: "Catégorie" }
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
          en: "Automatically generated from the category name and kept stable after create.",
          fr: "Généré automatiquement à partir du nom de la catégorie et conservé tel quel après la création."
        },
        position: "sidebar",
        readOnly: true
      }
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      required: true,
      label: { en: "Sort order", fr: "Ordre d'affichage" },
      admin: {
        description: {
          en: "Lower numbers appear first. The first category also becomes the large flagship plate on the home page.",
          fr: "Les valeurs les plus basses apparaissent en premier. La première catégorie devient aussi la grande vignette vedette de la page d'accueil."
        },
        position: "sidebar"
      }
    },
    {
      name: "image",
      type: "relationship",
      relationTo: "media",
      label: { en: "Image", fr: "Image" },
      admin: {
        description: {
          en: "Category image. Use a PNG cut out on a transparent background: the storefront draws its own contact shadow underneath, so the file must not contain one. Falls back to a placeholder when empty.",
          fr: "Image de la catégorie. Utilisez un PNG détouré sur fond transparent : la boutique dessine sa propre ombre portée, le fichier ne doit donc pas en contenir. Une image de remplacement s'affiche si le champ est vide."
        }
      }
    },
    {
      name: "headline",
      type: "textarea",
      label: { en: "French headline", fr: "Titre (français)" },
      required: true,
      admin: {
        description: {
          en: "French heading for the category masthead on the products page. Supports manual line breaks.",
          fr: "Titre français du bandeau de catégorie sur la page produits. Les sauts de ligne manuels sont pris en charge."
        }
      }
    },
    {
      name: "headlineAr",
      type: "textarea",
      label: { en: "Arabic headline", fr: "Titre (arabe)" },
      required: true,
      admin: {
        description: {
          en: "Arabic translation for the category masthead heading.",
          fr: "Traduction arabe du titre du bandeau de catégorie."
        }
      }
    },
    {
      name: "headlineEn",
      type: "textarea",
      label: { en: "English headline", fr: "Titre (anglais)" },
      admin: {
        description: {
          en: "English translation for the category masthead heading.",
          fr: "Traduction anglaise du titre du bandeau de catégorie."
        }
      }
    },
    {
      name: "collectionLabel",
      type: "text",
      label: { en: "French collection label", fr: "Libellé de collection (français)" },
      required: true,
      admin: {
        description: {
          en: 'Short French label, e.g. "Collection solaire". Sits above the category name on the home page and above the heading on the products page.',
          fr: "Libellé français court, par ex. « Collection solaire ». Il s'affiche au-dessus du nom de la catégorie sur la page d'accueil et au-dessus du titre sur la page produits."
        }
      }
    },
    {
      name: "collectionLabelAr",
      type: "text",
      label: { en: "Arabic collection label", fr: "Libellé de collection (arabe)" },
      required: true,
      admin: {
        description: {
          en: "Arabic translation for the collection label.",
          fr: "Traduction arabe du libellé de collection."
        }
      }
    },
    {
      name: "collectionLabelEn",
      type: "text",
      label: { en: "English collection label", fr: "Libellé de collection (anglais)" },
      admin: {
        description: {
          en: "English translation for the collection label.",
          fr: "Traduction anglaise du libellé de collection."
        }
      }
    },
    {
      name: "description",
      type: "textarea",
      label: { en: "French description", fr: "Description (français)" },
      required: true,
      admin: {
        description: {
          en: "French description. Shown on the flagship category plate on the home page and in the products page masthead.",
          fr: "Description française. Affichée sur la vignette de catégorie vedette de la page d'accueil et dans le bandeau de la page produits."
        }
      }
    },
    {
      name: "descriptionAr",
      type: "textarea",
      label: { en: "Arabic description", fr: "Description (arabe)" },
      required: true,
      admin: {
        description: {
          en: "Arabic translation for the category description.",
          fr: "Traduction arabe de la description de la catégorie."
        }
      }
    },
    {
      name: "descriptionEn",
      type: "textarea",
      label: { en: "English description", fr: "Description (anglais)" },
      admin: {
        description: {
          en: "English translation for the category description.",
          fr: "Traduction anglaise de la description de la catégorie."
        }
      }
    }
  ]
};
