"use client";

import dynamic from "next/dynamic";

function FaqSkeleton() {
  return (
    <section className="bg-background py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center md:mb-16">
          <div className="mx-auto h-10 w-80 animate-pulse rounded-lg bg-muted md:h-14 md:w-[28rem]" />
          <div className="mx-auto mt-4 h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="mx-auto max-w-2xl space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border/60 px-6 py-4">
              <div className="h-5 w-3/4 rounded bg-muted-foreground/10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const Faq3 = dynamic(
  () => import("@/components/mvpblocks/faq-3"),
  { ssr: false, loading: () => <FaqSkeleton /> }
);

export default function LazyFaq() {
  return <Faq3 />;
}
