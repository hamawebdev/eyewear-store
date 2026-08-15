import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/brand";
import { getAllStorefrontCategories } from "@/lib/payload/categories";
import { getAllStorefrontProducts } from "@/lib/payload/products";
import { STOREFRONT_LANGUAGE_VALUES } from "@/lib/storefront-language";

const STATIC_PATHS = [
  { changeFrequency: "weekly" as const, path: "", priority: 1 },
  { changeFrequency: "weekly" as const, path: "/products", priority: 0.8 },
  { changeFrequency: "yearly" as const, path: "/contact", priority: 0.5 },
  { changeFrequency: "yearly" as const, path: "/shipping", priority: 0.5 },
  { changeFrequency: "yearly" as const, path: "/returns", priority: 0.4 },
  { changeFrequency: "yearly" as const, path: "/terms", priority: 0.3 },
  { changeFrequency: "yearly" as const, path: "/privacy", priority: 0.3 }
];

/**
 * Every URL exists once per locale, and each entry lists the other locales as
 * `alternates.languages` so search engines can pair them up.
 */
const buildEntry = ({
  changeFrequency,
  lastModified,
  path,
  priority
}: {
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  lastModified: Date;
  path: string;
  priority: number;
}): MetadataRoute.Sitemap => {
  const baseUrl = getSiteUrl();

  return STOREFRONT_LANGUAGE_VALUES.map((language) => ({
    url: `${baseUrl}/${language}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: {
      languages: Object.fromEntries(
        STOREFRONT_LANGUAGE_VALUES.map((alternate) => [
          alternate,
          `${baseUrl}/${alternate}${path}`
        ])
      )
    }
  }));
};

// Generated per request: the catalogue lives in Postgres, and a sitemap should
// never make `next build` depend on the database being reachable.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = STATIC_PATHS.flatMap(({ changeFrequency, path, priority }) =>
    buildEntry({ changeFrequency, lastModified: now, path, priority })
  );

  let products: Awaited<ReturnType<typeof getAllStorefrontProducts>> = [];
  let categories: Awaited<ReturnType<typeof getAllStorefrontCategories>> = [];

  try {
    [products, categories] = await Promise.all([
      getAllStorefrontProducts(),
      getAllStorefrontCategories()
    ]);
  } catch (error) {
    // Still serve the static routes rather than a 500 if the catalogue is down.
    console.error("Sitemap could not load the catalogue:", error);
    return staticEntries;
  }

  return [
    ...staticEntries,
    ...categories.flatMap((category) =>
      buildEntry({
        changeFrequency: "weekly",
        lastModified: now,
        path: `/products?category=${category.slug}`,
        priority: 0.6
      })
    ),
    ...products.flatMap((product) =>
      buildEntry({
        changeFrequency: "weekly",
        lastModified: new Date(product.createdAt),
        path: `/products/${product.slug}`,
        priority: 0.7
      })
    )
  ];
}
