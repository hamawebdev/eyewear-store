import Image from "next/image";
import Link from "next/link";
import { getCategoryHref } from "@/lib/category-href";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import { getAllStorefrontCategories } from "@/lib/payload/categories";
import {
  getStorefrontDirection,
  resolveLocalizedText
} from "@/lib/storefront-language";
import { getServerStorefrontLanguage } from "@/lib/storefront-language.server";
import { shouldSkipImageOptimization } from "@/lib/storefront-image";
import type { Category } from "@/lib/schemas";
import type { StorefrontLanguage } from "@/lib/storefront-language";
import ArrowGlyph from "@/components/ui/arrow-glyph";
import FadeUpInView from "@/components/ui/fade-up-in-view";
import { cn } from "@/lib/utils";

/**
 * The lead plate spans 2 columns and 2 rows, which fills a 3-column grid
 * exactly at 6 categories (4 + 2 + 3 = 9 cells). Below 5 categories that
 * layout leaves an orphan cell, so the grid falls back to uniform plates.
 */
const LEAD_LAYOUT_MIN_CATEGORIES = 5;

const SPEC_LABEL = "font-spec uppercase text-muted-foreground";
const EASE_OUT = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/**
 * Text call-to-action. Renders a span so it can sit inside a parent <Link>
 * without nesting interactive elements; the parent supplies the `group`.
 */
function CtaText({ className, label }: { className?: string; label: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-2.5 self-start pb-1",
        SPEC_LABEL,
        "text-foreground text-[11px] tracking-[0.16em]",
        className
      )}
    >
      {label}
      <ArrowGlyph />
      <span
        aria-hidden="true"
        className={cn(
          "bg-accent absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-500 rtl:origin-right",
          EASE_OUT,
          "group-hover:scale-x-100 motion-reduce:transition-none"
        )}
      />
    </span>
  );
}

function CategoryPlate({
  category,
  isLead,
  language,
  moreInfoLabel
}: {
  category: Category;
  isLead: boolean;
  language: StorefrontLanguage;
  moreInfoLabel: string;
}) {
  const name = resolveLocalizedText(category.name, language);
  const label =
    resolveLocalizedText(category.collectionLabel, language).replace(/\s+/g, " ").trim() || name;

  return (
    <Link
      href={getCategoryHref(category.slug)}
      className="group focus-visible:outline-accent flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-8"
    >
      <div
        className={cn(
          "bg-secondary group-hover:bg-muted relative overflow-hidden rounded-[2px] transition-colors duration-500 motion-reduce:transition-none",
          isLead
            ? "aspect-[16/10] lg:aspect-auto lg:min-h-[320px] lg:flex-1"
            : "aspect-[4/5]"
        )}
      >
        <Image
          src={category.image.src}
          alt={category.image.alt}
          fill
          className={cn(
            "plate-art-shadow object-contain transition-transform duration-700 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
            EASE_OUT,
            "group-hover:scale-[1.035]",
            isLead ? "p-[9%] lg:p-[12%]" : "p-[14%]"
          )}
          sizes={
            isLead
              ? "(max-width: 1024px) 100vw, 66vw"
              : "(max-width: 1024px) 50vw, 33vw"
          }
          loading="lazy"
          unoptimized={shouldSkipImageOptimization(category.image.src)}
        />
      </div>

      <div className="border-border mt-4 border-t pt-3 sm:mt-5">
        <span className={cn(SPEC_LABEL, "block text-[10.5px] tracking-[0.16em]")}>
          {label}
        </span>

        <h3
          className={cn(
            "text-foreground mt-2 font-bold tracking-[-0.018em] text-balance",
            isLead ? "text-[26px] sm:text-3xl lg:text-[2.75rem]" : "text-lg sm:text-2xl",
            // Must follow the text-* classes: tailwind-merge treats font-size as
            // conflicting with leading and drops any leading declared before it.
            "leading-[1.12]",
            isLead && "lg:leading-[1.02]"
          )}
        >
          {name}
        </h3>

        {isLead ? (
          <>
            <p className="font-body text-muted-foreground mt-3 max-w-[46ch] text-[15px] leading-[1.65] text-pretty">
              {resolveLocalizedText(category.description, language)}
            </p>
            <CtaText className="mt-5" label={moreInfoLabel} />
          </>
        ) : null}
      </div>
    </Link>
  );
}

export default async function Categories() {
  const language = await getServerStorefrontLanguage();
  const copy = getStorefrontCopy(language);
  const featuredCategories = await getAllStorefrontCategories();

  if (featuredCategories.length === 0) {
    return null;
  }

  const useLeadLayout = featuredCategories.length >= LEAD_LAYOUT_MIN_CATEGORIES;

  return (
    <section
      className="bg-background py-24 sm:py-32"
      dir={getStorefrontDirection(language)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header>
          <div className="flex items-center gap-4 sm:gap-6">
            <span className={cn(SPEC_LABEL, "text-[11px] tracking-[0.2em] whitespace-nowrap")}>
              {copy.categories.eyebrow}
            </span>
            <span aria-hidden="true" className="bg-border h-px flex-1" />
            <span className={cn(SPEC_LABEL, "text-[11px] tracking-[0.14em] whitespace-nowrap")}>
              {featuredCategories.length} {copy.categories.unit}
            </span>
          </div>

          <div className="mt-8 grid gap-8 md:mt-10 md:grid-cols-[1.25fr_1fr] md:items-end md:gap-12 lg:gap-16">
            <h2 className="text-foreground text-4xl leading-[0.96] font-bold tracking-[-0.028em] text-balance sm:text-5xl lg:text-6xl">
              {copy.categories.headlineLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>

            <div>
              <p className="font-body text-muted-foreground max-w-[46ch] text-[15px] leading-[1.7] text-pretty">
                {copy.categories.lede}
              </p>
              <Link
                href="/products"
                className="group focus-visible:outline-accent mt-6 inline-flex focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                <CtaText label={copy.categories.viewAll} />
              </Link>
            </div>
          </div>
        </header>

        <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 sm:gap-y-12 md:mt-20 lg:grid-cols-3 lg:gap-6">
          {featuredCategories.map((category, index) => {
            const isLead = useLeadLayout && index === 0;

            return (
              <FadeUpInView
                key={category.slug}
                delay={index * 0.08}
                amount={0.15}
                className={cn("h-full", isLead && "col-span-2 lg:row-span-2")}
              >
                <CategoryPlate
                  category={category}
                  isLead={isLead}
                  language={language}
                  moreInfoLabel={copy.categories.moreInfo}
                />
              </FadeUpInView>
            );
          })}
        </div>
      </div>
    </section>
  );
}
