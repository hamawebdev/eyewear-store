import { unstable_cache } from "next/cache";
import {
  CategorySchema,
  ProductCategoryRefSchema,
  type Category,
  type ProductCategoryRef
} from "@/lib/schemas";
import { getPayloadClient } from "@/lib/payload/server";
import { getPayloadMediaImage } from "@/lib/storefront-image.server";
import { buildLocalizedText } from "@/lib/storefront-language";
import type {
  PayloadCategoryDocument,
  PayloadCategoryReference
} from "./types";

export const mapCategoryDocument = async (doc: PayloadCategoryDocument): Promise<Category> =>
  CategorySchema.parse({
    id: String(doc.id),
    description: buildLocalizedText({
      ar: doc.descriptionAr,
      fr: doc.description,
      en: doc.descriptionEn ?? doc.description
    }),
    headline: buildLocalizedText({
      ar: doc.headlineAr,
      fr: doc.headline,
      en: doc.headlineEn ?? doc.headline
    }),
    image: await getPayloadMediaImage(doc.image, {
      altFallback: doc.name
    }),
    name: buildLocalizedText({
      ar: doc.nameAr,
      fr: doc.name,
      en: doc.nameEn ?? doc.name
    }),
    collectionLabel: buildLocalizedText({
      ar: doc.collectionLabelAr?.trim() || doc.nameAr,
      fr: doc.collectionLabel?.trim() || doc.name,
      en: doc.collectionLabelEn?.trim() || doc.nameEn || doc.name
    }),
    slug: doc.slug,
    sortOrder: doc.sortOrder
  });

const toCategoryRef = ({
  id,
  nameAr,
  name,
  nameEn,
  slug
}: {
  id: number | string;
  name: string;
  nameAr: string;
  nameEn?: string;
  slug: string;
}): ProductCategoryRef =>
  ProductCategoryRefSchema.parse({
    id: String(id),
    name: buildLocalizedText({
      ar: nameAr,
      fr: name,
      en: nameEn ?? name
    }),
    slug
  });

export const normalizeProductCategoryRef = (
  value: PayloadCategoryReference
): ProductCategoryRef | null => {
  if (!value) {
    return null;
  }

  if (
    typeof value === "object" &&
    typeof value.name === "string" &&
    typeof value.slug === "string"
  ) {
    return toCategoryRef({
      id: value.id,
      name: value.name,
      nameAr: typeof value.nameAr === "string" ? value.nameAr : value.name,
      nameEn: typeof value.nameEn === "string" ? value.nameEn : value.name,
      slug: value.slug
    });
  }

  return null;
};

export const getAllStorefrontCategories = unstable_cache(
  async () => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "categories",
      depth: 1,
      overrideAccess: false,
      pagination: false,
      sort: "sortOrder"
    });

    const categories = (await Promise.all(
      (result.docs as PayloadCategoryDocument[]).map((doc) => mapCategoryDocument(doc))
    )).sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.name.fr.localeCompare(b.name.fr);
    });

    return categories;
  },
  ["storefront-categories"],
  { revalidate: 60 }
);
