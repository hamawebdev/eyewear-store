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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-px flex-1 bg-border" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-8 grid gap-8 md:mt-10 md:grid-cols-[1.25fr_1fr] md:items-end md:gap-12 lg:gap-16">
          <div className="space-y-3">
            <div className="h-10 w-full max-w-md animate-pulse rounded bg-muted lg:h-14" />
            <div className="h-10 w-3/4 max-w-sm animate-pulse rounded bg-muted lg:h-14" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 sm:gap-y-12 md:mt-20 lg:grid-cols-3 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={i === 0 ? "col-span-2 lg:row-span-2" : undefined}
            >
              <div
                className={`animate-pulse rounded-[2px] bg-muted [transform:translateZ(0)] ${
                  i === 0 ? "aspect-[16/10] lg:aspect-[4/5]" : "aspect-[4/5]"
                }`}
              />
              <div className="mt-4 border-t border-border pt-3 sm:mt-5">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-6 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
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
      {/* Client feedback section hidden for now (not deleted) — re-enable by uncommenting. */}
      {/* <LazyTestimonials /> */}
      <LazyFaq />
    </main>
  );
}
