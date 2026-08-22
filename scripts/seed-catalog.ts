import fs from "node:fs";
import path from "node:path";
import { loadScriptPayloadClient } from "./payload-script-helpers";

type LocalizedValue = {
  ar: string;
  fr: string;
  en: string;
};

type CatalogProductOption = {
  isDefault?: boolean;
  label: string;
  labelAr: string;
  labelEn?: string;
  originalPrice?: number;
  price: number;
};

type CatalogProduct = {
  badge?: LocalizedValue;
  description: LocalizedValue;
  featuredRank?: number;
  features?: LocalizedValue[];
  frameColor?: string;
  frameShape?: string;
  gender?: string;
  name: LocalizedValue;
  options?: CatalogProductOption[];
  pricingMode: "options" | "simple";
  simpleOriginalPrice?: number;
  simplePrice?: number;
  slug: string;
};

type CatalogCategory = {
  description: LocalizedValue;
  headline: LocalizedValue;
  /** Repo-relative source picture, uploaded to Payload by `categories:images`. */
  image?: string;
  name: LocalizedValue;
  collectionLabel: LocalizedValue;
  products: CatalogProduct[];
  slug: string;
};

type CatalogDocument = {
  categories: CatalogCategory[];
  localeSupport: string[];
};

type ProductPricing =
  | {
      options: CatalogProductOption[];
      pricingMode: "options";
    }
  | {
      pricingMode: "simple";
      simpleOriginalPrice?: number;
      simplePrice: number;
    };

type CategoryDocument = {
  id: number | string;
  name?: string;
};

type ProductDocument = {
  id: number | string;
  name?: string;
};

const CATALOG_PATH = path.resolve(process.cwd(), "categories", "catalog.json");

const assertNonEmptyString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value.trim();
};

/**
 * Pricing is taken verbatim from the catalog — there is deliberately no
 * category-based inference and no fallback price, so a mis-authored product
 * fails the seed instead of silently shipping at the wrong price.
 */
const resolveProductPricing = (product: CatalogProduct): ProductPricing => {
  if (product.pricingMode === "simple") {
    if (typeof product.simplePrice !== "number" || product.simplePrice <= 0) {
      throw new Error(`Product ${product.slug} uses simple pricing but has no valid simplePrice.`);
    }

    return {
      pricingMode: "simple",
      simpleOriginalPrice: product.simpleOriginalPrice,
      simplePrice: product.simplePrice
    };
  }

  const options = product.options ?? [];

  if (options.length === 0) {
    throw new Error(`Product ${product.slug} uses option pricing but defines no options.`);
  }

  const defaultOptions = options.filter((option) => option.isDefault);

  if (defaultOptions.length !== 1) {
    throw new Error(
      `Product ${product.slug} must mark exactly one default option, found ${defaultOptions.length}.`
    );
  }

  options.forEach((option, optionIndex) => {
    assertNonEmptyString(option.label, `FR label of option ${optionIndex} on ${product.slug}`);
    assertNonEmptyString(option.labelAr, `AR label of option ${optionIndex} on ${product.slug}`);

    if (typeof option.price !== "number" || option.price <= 0) {
      throw new Error(`Option ${optionIndex} on ${product.slug} needs a positive price.`);
    }
  });

  return {
    options: options.map((option) => ({
      ...option,
      labelEn: option.labelEn ?? option.label
    })),
    pricingMode: "options"
  };
};

const loadCatalog = (): CatalogDocument => {
  const raw = fs.readFileSync(CATALOG_PATH, "utf8");
  const parsed = JSON.parse(raw) as CatalogDocument;

  if (!Array.isArray(parsed.localeSupport) || !Array.isArray(parsed.categories)) {
    throw new Error("categories/catalog.json has an invalid shape.");
  }

  const seenCategorySlugs = new Set<string>();
  const seenProductSlugs = new Set<string>();

  parsed.categories.forEach((category, categoryIndex) => {
    const categorySlug = assertNonEmptyString(
      category.slug,
      `Category slug at index ${categoryIndex}`
    );

    if (seenCategorySlugs.has(categorySlug)) {
      throw new Error(`Duplicate category slug "${categorySlug}".`);
    }

    seenCategorySlugs.add(categorySlug);

    (["name", "headline", "collectionLabel", "description"] as const).forEach((field) => {
      (["fr", "ar", "en"] as const).forEach((locale) => {
        assertNonEmptyString(
          category[field]?.[locale],
          `Category ${locale.toUpperCase()} ${field} for ${categorySlug}`
        );
      });
    });

    if (!Array.isArray(category.products)) {
      throw new Error(`Category ${categorySlug} must define a products array.`);
    }

    category.products.forEach((product, productIndex) => {
      const productSlug = assertNonEmptyString(
        product.slug,
        `Product slug at index ${productIndex} in category ${categorySlug}`
      );

      if (seenProductSlugs.has(productSlug)) {
        throw new Error(`Duplicate product slug "${productSlug}".`);
      }

      seenProductSlugs.add(productSlug);

      (["name", "description"] as const).forEach((field) => {
        (["fr", "ar", "en"] as const).forEach((locale) => {
          assertNonEmptyString(
            product[field]?.[locale],
            `Product ${locale.toUpperCase()} ${field} for ${productSlug}`
          );
        });
      });

      (product.features ?? []).forEach((feature, featureIndex) => {
        // The products collection rejects a French feature without its Arabic
        // counterpart, so fail here with a clearer message than Payload gives.
        assertNonEmptyString(
          feature?.fr,
          `FR text of feature ${featureIndex} on ${productSlug}`
        );
        assertNonEmptyString(
          feature?.ar,
          `AR text of feature ${featureIndex} on ${productSlug}`
        );
      });

      resolveProductPricing(product);
    });
  });

  return parsed;
};

const findFirstDoc = async <T extends { id: number | string }>({
  collection,
  payload,
  where
}: {
  collection: string;
  payload: Awaited<ReturnType<typeof loadScriptPayloadClient>>;
  where: Record<string, unknown>;
}): Promise<T | null> => {
  const result = (await payload.find({
    collection,
    limit: 2,
    overrideAccess: true,
    pagination: false,
    where
  })) as { docs: T[] };

  if (result.docs.length > 1) {
    console.warn(
      `Multiple ${collection} documents matched ${JSON.stringify(where)}. Using the first.`
    );
  }

  return result.docs[0] ?? null;
};

const seedCategories = async ({
  catalog,
  payload
}: {
  catalog: CatalogDocument;
  payload: Awaited<ReturnType<typeof loadScriptPayloadClient>>;
}) => {
  const categoryMap = new Map<string, number | string>();

  for (const [index, category] of catalog.categories.entries()) {
    const existingCategory = await findFirstDoc<CategoryDocument>({
      collection: "categories",
      payload,
      where: {
        slug: {
          equals: category.slug
        }
      }
    });

    const categoryData = {
      description: category.description.fr,
      descriptionAr: category.description.ar,
      descriptionEn: category.description.en,
      headline: category.headline.fr,
      headlineAr: category.headline.ar,
      headlineEn: category.headline.en,
      name: category.name.fr,
      nameAr: category.name.ar,
      nameEn: category.name.en,
      collectionLabel: category.collectionLabel.fr,
      collectionLabelAr: category.collectionLabel.ar,
      collectionLabelEn: category.collectionLabel.en,
      slug: category.slug,
      sortOrder: index + 1
    };

    if (existingCategory) {
      const updatedCategory = (await payload.update({
        collection: "categories",
        data: categoryData,
        id: existingCategory.id,
        overrideAccess: true
      })) as CategoryDocument;

      categoryMap.set(category.slug, updatedCategory.id);
      payload.logger.info(`Updated category ${category.slug}`);
      continue;
    }

    const createdCategory = (await payload.create({
      collection: "categories",
      data: categoryData,
      overrideAccess: true
    })) as CategoryDocument;

    categoryMap.set(category.slug, createdCategory.id);
    payload.logger.info(`Created category ${category.slug}`);
  }

  return categoryMap;
};

const seedProducts = async ({
  catalog,
  categoryMap,
  payload
}: {
  catalog: CatalogDocument;
  categoryMap: Map<string, number | string>;
  payload: Awaited<ReturnType<typeof loadScriptPayloadClient>>;
}) => {
  for (const category of catalog.categories) {
    const categoryId = categoryMap.get(category.slug);

    if (categoryId == null) {
      throw new Error(`Category "${category.slug}" was not seeded.`);
    }

    for (const product of category.products) {
      const productPricing = resolveProductPricing(product);
      const existingProduct = await findFirstDoc<ProductDocument>({
        collection: "products",
        payload,
        where: {
          slug: {
            equals: product.slug
          }
        }
      });

      const productData = {
        badge: product.badge?.fr ?? null,
        badgeAr: product.badge?.ar ?? null,
        badgeEn: product.badge?.en ?? null,
        category: categoryId,
        description: product.description.fr,
        descriptionAr: product.description.ar,
        descriptionEn: product.description.en,
        featuredRank: product.featuredRank ?? null,
        features: (product.features ?? []).map((feature) => ({
          text: feature.fr,
          textAr: feature.ar,
          textEn: feature.en
        })),
        frameColor: product.frameColor ?? null,
        frameShape: product.frameShape ?? null,
        gender: product.gender ?? null,
        name: product.name.fr,
        nameAr: product.name.ar,
        nameEn: product.name.en,
        slug: product.slug,
        ...productPricing
      };

      if (existingProduct) {
        await payload.update({
          collection: "products",
          data: productData,
          id: existingProduct.id,
          overrideAccess: true
        });
        payload.logger.info(`Updated product ${product.slug}`);
        continue;
      }

      await payload.create({
        collection: "products",
        data: productData,
        overrideAccess: true
      });
      payload.logger.info(`Created product ${product.slug}`);
    }
  }
};

// Categories can be rolled out ahead of the product remap, so the taxonomy is
// in place while products still point at the old categories.
const IS_CATEGORIES_ONLY = process.argv.includes("--categories-only");

async function seedCatalog() {
  const payload = await loadScriptPayloadClient();
  const catalog = loadCatalog();

  if (IS_CATEGORIES_ONLY) {
    payload.logger.info(
      `Seeding ${catalog.categories.length} categories only — products and images are left untouched.`
    );

    await seedCategories({ catalog, payload });

    payload.logger.info("Successfully seeded catalog categories.");
    process.exit(0);
  }

  payload.logger.info(
    `Seeding catalog with ${catalog.categories.length} categories and ${catalog.categories.reduce(
      (count, category) => count + category.products.length,
      0
    )} products...`
  );

  const categoryMap = await seedCategories({ catalog, payload });
  await seedProducts({ catalog, categoryMap, payload });

  payload.logger.info("Successfully seeded catalog categories and products.");
  process.exit(0);
}

seedCatalog().catch((error) => {
  console.error(error);
  process.exit(1);
});
