import { Suspense } from "react";
import ProductsPageClient from "@/components/products/ProductsPageClient";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import { getAllStorefrontCategories } from "@/lib/payload/categories";
import { getAllStorefrontProducts } from "@/lib/payload/products";
import { getServerStorefrontLanguage } from "@/lib/storefront-language.server";
import type { Metadata } from "next";
import { buildLocalizedMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getServerStorefrontLanguage();
  const copy = getStorefrontCopy(language);

  return buildLocalizedMetadata({
    description: copy.footer.description,
    language,
    path: "/products",
    title: copy.productsPage.heading
  });
}


export const dynamic = "force-dynamic";


const ProductsPageFallback = ({ loadingLabel }: { loadingLabel: string }) => (
  <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
      <p className="text-sm text-stone-600">{loadingLabel}</p>
    </div>
  </div>
);

export default async function ProductsPage() {
  const language = await getServerStorefrontLanguage();
  const copy = getStorefrontCopy(language);
  const [products, categories] = await Promise.all([
    getAllStorefrontProducts(),
    getAllStorefrontCategories()
  ]);

  return (
    <Suspense fallback={<ProductsPageFallback loadingLabel={copy.productsPage.loading} />}>
      <ProductsPageClient categories={categories} products={products} />
    </Suspense>
  );
}
