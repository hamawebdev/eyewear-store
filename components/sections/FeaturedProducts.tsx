import ProductCard from "@/components/ProductCard";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import { getFeaturedProducts } from "@/lib/payload/products";
import type { StorefrontLanguage } from "@/lib/storefront-language";
import FadeUpInView from "@/components/ui/fade-up-in-view";

export default async function FeaturedProducts({
  language
}: {
  language: StorefrontLanguage;
}) {
  const copy = getStorefrontCopy(language);
  const featuredProducts = await getFeaturedProducts(6);

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative mb-12 text-center md:mb-16">
          <h2 className="from-foreground to-foreground/40 mb-4 bg-gradient-to-b bg-clip-text text-3xl font-bold text-transparent md:text-5xl lg:text-6xl">
            {copy.featuredProducts.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product, index) => (
            <FadeUpInView key={product.id} delay={index * 0.08} amount={0.12}>
              <ProductCard product={product} />
            </FadeUpInView>
          ))}
        </div>
      </div>
    </section>
  );
}
