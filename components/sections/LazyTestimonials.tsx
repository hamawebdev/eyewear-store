"use client";

import dynamic from "next/dynamic";

function TestimonialsSkeleton() {
  return (
    <section className="bg-background relative overflow-hidden py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative mb-12 text-center md:mb-16">
          <div className="mx-auto h-10 w-80 animate-pulse rounded-lg bg-muted md:h-14 md:w-[28rem]" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[280px] animate-pulse rounded-2xl border border-border bg-muted p-6 sm:min-w-[300px] md:min-w-[320px]"
            >
              <div className="mb-4 h-10 w-10 rounded bg-muted-foreground/10" />
              <div className="mb-6 space-y-2">
                <div className="h-4 w-full rounded bg-muted-foreground/10" />
                <div className="h-4 w-3/4 rounded bg-muted-foreground/10" />
              </div>
              <div className="flex items-center gap-3 border-t border-border/40 pt-2">
                <div className="h-10 w-10 rounded-full bg-muted-foreground/10" />
                <div className="space-y-1">
                  <div className="h-4 w-20 rounded bg-muted-foreground/10" />
                  <div className="h-3 w-16 rounded bg-muted-foreground/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TestimonialsCarousel = dynamic(
  () => import("@/components/mvpblocks/testimonials-carousel"),
  { ssr: false, loading: () => <TestimonialsSkeleton /> }
);

export default function LazyTestimonials() {
  return <TestimonialsCarousel />;
}
