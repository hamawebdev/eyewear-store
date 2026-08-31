import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailPage, { ProductDetailSecondary } from "@/app/[locale]/products/[id]/product-detail";
import { BRAND, getSiteUrl } from "@/lib/brand";
import { getApprovedProductReviews } from "@/lib/payload/product-reviews";
import {
  getRelatedProducts,
  getStorefrontProductBySlug,
  getStorefrontProductSlugs
} from "@/lib/payload/products";
import { isStoredStorefrontImage } from "@/lib/storefront-image";
import {
  isStorefrontLanguage,
  resolveLocalizedText,
  STOREFRONT_LANGUAGE_VALUES
} from "@/lib/storefront-language";

/**
 * Prerendered per locale so a click from the category grid is served from the
 * prefetched payload instead of a fresh render. Product writes revalidate this
 * through the hooks in collections/products.ts.
 */
export const revalidate = 3600;

/** A product added after the last build still renders, then gets cached. */
export const dynamicParams = true;

/** See the note on `generateStaticParams` in app/[locale]/layout.tsx. */
export async function generateStaticParams() {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  const slugs = await getStorefrontProductSlugs();

  return STOREFRONT_LANGUAGE_VALUES.flatMap((locale) =>
    slugs.map((slug) => ({ id: slug, locale }))
  );
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id: slug, locale } = await params;
  const product = await getStorefrontProductBySlug(slug);

  if (!product) {
    return {};
  }

  const language = isStorefrontLanguage(locale) ? locale : "ar";
  const name = resolveLocalizedText(product.name, language);
  const description = product.description
    ? resolveLocalizedText(product.description, language)
    : undefined;
  const baseUrl = getSiteUrl();
  const image = isStoredStorefrontImage(product.image) ? product.image.src : undefined;

  return {
    title: name,
    description,
    alternates: {
      canonical: `${baseUrl}/${language}/products/${product.slug}`,
      languages: Object.fromEntries(
        STOREFRONT_LANGUAGE_VALUES.map((alternate) => [
          alternate,
          `${baseUrl}/${alternate}/products/${product.slug}`
        ])
      )
    },
    openGraph: {
      title: `${name} | ${BRAND.name}`,
      description,
      type: "website",
      url: `${baseUrl}/${language}/products/${product.slug}`,
      ...(image ? { images: [image] } : {})
    }
  };
}

async function RelatedAndReviews({
  categorySlug,
  productId,
  productName
}: {
  categorySlug: string;
  productId: string;
  productName: { ar: string; fr: string; en: string };
}) {
  const [relatedProducts, approvedReviews] = await Promise.all([
    getRelatedProducts({
      categorySlug,
      excludeId: productId,
      limit: 3
    }),
    getApprovedProductReviews(productId)
  ]);

  return (
    <ProductDetailSecondary
      relatedProducts={relatedProducts}
      approvedReviews={approvedReviews}
      productId={productId}
      productName={productName}
    />
  );
}

export default async function Page({
  params
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id: slug, locale } = await params;
  const product = await getStorefrontProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const language = isStorefrontLanguage(locale) ? locale : "ar";
  const productImage = isStoredStorefrontImage(product.image) ? product.image.src : undefined;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: resolveLocalizedText(product.name, language),
    ...(product.description
      ? { description: resolveLocalizedText(product.description, language) }
      : {}),
    ...(productImage ? { image: [productImage] } : {}),
    brand: {
      "@type": "Brand",
      name: BRAND.name
    },
    category: resolveLocalizedText(product.category.name, language),
    ...(product.reviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviews
          }
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: process.env.NEXT_PUBLIC_STORE_CURRENCY ?? "DZD",
      availability: "https://schema.org/InStock",
      url: `${getSiteUrl()}/${language}/products/${product.slug}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailPage product={product} />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mt-12 border-t border-border pt-12">
              <div className="h-8 w-40 animate-pulse rounded bg-muted" />
            </div>
            <div className="mt-16">
              <div className="mb-8 h-8 w-48 animate-pulse rounded bg-stone-100" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="aspect-square animate-pulse bg-stone-100" />
                    <div className="space-y-3 p-4">
                      <div className="h-5 w-3/4 animate-pulse rounded bg-stone-100" />
                      <div className="h-5 w-1/3 animate-pulse rounded bg-stone-100" />
                      <div className="h-9 w-full animate-pulse rounded-md bg-stone-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <RelatedAndReviews
          categorySlug={product.category.slug}
          productId={product.id}
          productName={product.name}
        />
      </Suspense>
    </>
  );
}
