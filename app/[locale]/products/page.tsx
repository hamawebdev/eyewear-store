import ProductsPageClient from "@/components/products/ProductsPageClient";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import { getAllStorefrontCategories } from "@/lib/payload/categories";
import { getAllStorefrontProducts } from "@/lib/payload/products";
import { normalizeStorefrontLanguage } from "@/lib/storefront-language";
import type { Metadata } from "next";
import { buildLocalizedMetadata } from "@/lib/seo";

/**
 * Prerendered, with the catalogue revalidated by the Payload hooks in
 * collections/products.ts rather than by the clock — the long window is just a
 * backstop. Category selection is a `?category=` filter applied client-side, so
 * switching category never touches the network.
 */
export const revalidate = 3600;

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const language = normalizeStorefrontLanguage(locale);
  const copy = getStorefrontCopy(language);

  return buildLocalizedMetadata({
    description: copy.footer.description,
    language,
    path: "/products",
    title: copy.productsPage.heading
  });
}

/**
 * The grid renders every product; `ProductsPageClient` narrows it from the
 * `?category=` / facet params on the client. The locale reaches the client tree
 * through `StorefrontLanguageProvider`, which reads the same `[locale]` segment.
 */
export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getAllStorefrontProducts(),
    getAllStorefrontCategories()
  ]);

  return <ProductsPageClient categories={categories} products={products} />;
}
