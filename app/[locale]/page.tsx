import { Suspense } from "react";
import Hero from "@/components/sections/Hero";
import BrandPromise from "@/components/sections/BrandPromise";
import Categories from "@/components/sections/Categories";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import LazyTestimonials from "@/components/sections/LazyTestimonials";
import LazyFaq from "@/components/sections/LazyFaq";
import FadeUpInView from "@/components/ui/fade-up-in-view";

export const dynamic = "force-dynamic";

function CategoriesSkeleton() {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center md:mb-16">
          <div className="mx-auto h-10 w-72 animate-pulse rounded-lg bg-muted md:h-14 md:w-96" />
        </div>
        <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 lg:gap-x-16 lg:gap-y-24">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mx-auto aspect-[432/488] w-full max-w-[432px] animate-pulse rounded-3xl bg-muted [transform:translateZ(0)]" />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedProductsSkeleton() {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center md:mb-16">
          <div className="mx-auto h-10 w-64 animate-pulse rounded-lg bg-muted md:h-14 md:w-80" />
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl bg-muted [transform:translateZ(0)]">
              <div className="aspect-square" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-3/4 rounded bg-muted-foreground/10" />
                <div className="h-5 w-1/3 rounded bg-muted-foreground/10" />
                <div className="h-9 w-full rounded bg-muted-foreground/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="homepage-serif">
      <Hero />
      <FadeUpInView>
        <BrandPromise />
      </FadeUpInView>
      <Suspense fallback={<CategoriesSkeleton />}>
        <Categories />
      </Suspense>
      <Suspense fallback={<FeaturedProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>
      <LazyTestimonials />
      <LazyFaq />
    </main>
  );
}
