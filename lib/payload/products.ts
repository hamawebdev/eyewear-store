import { unstable_cache } from "next/cache";
import type { Where } from "payload";
import { CACHE_TAGS } from "@/lib/payload/cache-tags";
import { normalizeProductCategoryRef } from "@/lib/payload/categories";
import { getPayloadClient } from "@/lib/payload/server";
import { isStoredStorefrontImage } from "@/lib/storefront-image";
import { getPayloadMediaImage } from "@/lib/storefront-image.server";
import type {
  PayloadProductDocument,
  PayloadProductFeatureRow,
  PayloadProductOptionRow
} from "@/lib/payload/types";
import {
  ProductCategoryRefSchema,
  ProductSchema,
  type Product,
  type ProductOption
} from "@/lib/schemas";
import { slugifyText } from "@/lib/slug";
import { isFrameColor, isFrameShape, isGender } from "@/lib/eyewear";
import { buildLocalizedText } from "@/lib/storefront-language";

const toTimestamp = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const mapOption = (productId: string, option: PayloadProductOptionRow): ProductOption | null => {
  const label = option.label?.trim();
  const labelAr = option.labelAr?.trim() || label;

  if (!label || !labelAr || typeof option.price !== "number") {
    return null;
  }

  const labelEn = option.labelEn?.trim() || label;

  return {
    id: option.id || `${productId}-${slugifyText(label)}`,
    isDefault: Boolean(option.isDefault),
    label: buildLocalizedText({
      ar: labelAr,
      fr: label,
      en: labelEn
    }),
    price: option.price,
    originalPrice: typeof option.originalPrice === "number" ? option.originalPrice : undefined
  };
};

const mapFeature = (feature: PayloadProductFeatureRow) => {
  const text = feature.text?.trim();

  if (!text) {
    return null;
  }

  return buildLocalizedText({
    ar: feature.textAr?.trim() || text,
    fr: text,
    en: feature.textEn?.trim() || text
  });
};

const sortByFeaturedPriority = (a: Product, b: Product) => {
  const leftRank = a.featuredRank ?? Number.MAX_SAFE_INTEGER;
  const rightRank = b.featuredRank ?? Number.MAX_SAFE_INTEGER;

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
};

const getFallbackCategoryRef = () =>
  ProductCategoryRefSchema.parse({
    id: "uncategorized",
    name: {
      ar: "غير مصنف",
      fr: "Non classé",
      en: "Uncategorized"
    },
    slug: "uncategorized"
  });

const mapProductDocument = async (doc: PayloadProductDocument): Promise<Product> => {
  const productId = String(doc.id);
  const primaryImage = await getPayloadMediaImage(doc.primaryImage, {
    altFallback: doc.name
  });
  const artboardImage = await getPayloadMediaImage(doc.artboardImage, {
    altFallback: `Artboard for ${doc.name}`
  });
  const galleryImages = Array.isArray(doc.gallery)
    ? await Promise.all(
      doc.gallery.map((image, index) =>
        getPayloadMediaImage(image, {
          altFallback: `${doc.name} view ${index + 1}`
        })
      )
    )
    : [];
  const images = [primaryImage, ...galleryImages].filter(
    (image, index, imageList) =>
      isStoredStorefrontImage(image) &&
      imageList.findIndex((candidate) => candidate.src === image.src) === index
  );
  const options = Array.isArray(doc.options)
    ? doc.options
      .map((option) => mapOption(productId, option))
      .filter((option): option is ProductOption => Boolean(option))
    : [];
  const features = Array.isArray(doc.features)
    ? doc.features
      .map(mapFeature)
      .filter((feature): feature is NonNullable<ReturnType<typeof mapFeature>> => Boolean(feature))
    : [];
  const category = normalizeProductCategoryRef(doc.category) ?? getFallbackCategoryRef();

  return ProductSchema.parse({
    id: productId,
    slug: doc.slug,
    createdAt: doc.createdAt,
    featuredRank: typeof doc.featuredRank === "number" ? doc.featuredRank : undefined,
    name: buildLocalizedText({
      ar: doc.nameAr,
      fr: doc.name,
      en: doc.nameEn ?? doc.name
    }),
    price: doc.displayPrice,
    originalPrice:
      typeof doc.displayOriginalPrice === "number" ? doc.displayOriginalPrice : undefined,
    image: primaryImage,
    artboardImage: isStoredStorefrontImage(artboardImage) ? artboardImage : undefined,
    images: images.length > 0 ? images : undefined,
    rating: doc.rating,
    reviews: doc.reviews,
    category,
    badge: doc.badge
      ? buildLocalizedText({
          ar: doc.badgeAr?.trim() || doc.badge,
          fr: doc.badge,
          en: doc.badgeEn?.trim() || doc.badge
        })
      : undefined,
    description: doc.description
      ? buildLocalizedText({
          ar: doc.descriptionAr?.trim() || doc.description,
          fr: doc.description,
          en: doc.descriptionEn?.trim() || doc.description
        })
      : undefined,
    options: options.length > 0 ? options : undefined,
    features: features.length > 0 ? features : undefined,
    frameShape: isFrameShape(doc.frameShape) ? doc.frameShape : undefined,
    gender: isGender(doc.gender) ? doc.gender : undefined,
    frameColor: isFrameColor(doc.frameColor) ? doc.frameColor : undefined
  });
};

const findProducts = async (where?: Where) => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "products",
    depth: 1,
    overrideAccess: false,
    pagination: false,
    sort: "-createdAt",
    ...(where ? { where } : {})
  });

  return Promise.all((result.docs as PayloadProductDocument[]).map((doc) => mapProductDocument(doc)));
};

/**
 * Every read below is tagged `CACHE_TAGS.products`, so the `afterChange` /
 * `afterDelete` hooks in collections/products.ts invalidate all of them in one
 * call. The `revalidate` windows are only a backstop for anything that writes to
 * Postgres outside Payload.
 */
const PRODUCT_CACHE_OPTIONS = { revalidate: 3600, tags: [CACHE_TAGS.products] };

export const getAllStorefrontProducts = unstable_cache(
  async () => findProducts(),
  ["storefront-products"],
  PRODUCT_CACHE_OPTIONS
);

export const getFeaturedProducts = unstable_cache(
  async (limit = 6) => {
    const products = await findProducts({
      featuredRank: {
        exists: true
      }
    });

    return products.sort(sortByFeaturedPriority).slice(0, limit);
  },
  ["featured-products"],
  PRODUCT_CACHE_OPTIONS
);

/** Slugs for `generateStaticParams` on /[locale]/products/[id]. */
export const getStorefrontProductSlugs = unstable_cache(
  async () => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "products",
      depth: 0,
      overrideAccess: false,
      pagination: false,
      select: { slug: true }
    });

    return (result.docs as Array<{ slug: string }>)
      .map((doc) => doc.slug)
      .filter((slug): slug is string => Boolean(slug));
  },
  ["storefront-product-slugs"],
  PRODUCT_CACHE_OPTIONS
);

export const getStorefrontProductBySlug = async (slug: string) => {
  return unstable_cache(
    async () => {
      const payload = await getPayloadClient();

      const result = await payload.find({
        collection: "products",
        depth: 1,
        limit: 1,
        overrideAccess: false,
        pagination: false,
        where: {
          slug: {
            equals: slug
          }
        }
      });

      const productDoc = (result.docs as PayloadProductDocument[])[0];
      return productDoc ? mapProductDocument(productDoc) : null;
    },
    [`product-${slug}`],
    PRODUCT_CACHE_OPTIONS
  )();
};

/**
 * Cached per category, not per product.
 *
 * This used to load the entire catalogue and filter it in JS, under a key that
 * included `excludeId` — so every product page built its own cache entry and
 * every one of them re-ran `sharp` over every image in the store. Filtering the
 * current product out happens after the cache read, so all products in a
 * category share one entry.
 */
const getCategoryProducts = (categorySlug: string) =>
  unstable_cache(
    async () =>
      (
        await findProducts({
          "category.slug": {
            equals: categorySlug
          }
        })
      ).sort(sortByFeaturedPriority),
    [`category-products-${categorySlug}`],
    PRODUCT_CACHE_OPTIONS
  )();

export const getRelatedProducts = async ({
  categorySlug,
  excludeId,
  limit = 3
}: {
  categorySlug: string;
  excludeId: string;
  limit?: number;
}) => {
  const products = await getCategoryProducts(categorySlug);

  return products.filter((product) => product.id !== excludeId).slice(0, limit);
};
