"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ArrowGlyph from "@/components/ui/arrow-glyph";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import { getCategoryHref } from "@/lib/category-href";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import type { Category } from "@/lib/schemas";
import { resolveLocalizedText } from "@/lib/storefront-language";
import { cn } from "@/lib/utils";

interface ProductsCategorySpotlightProps {
  activeCategory?: string;
  categories: Category[];
  onCategoryChange?: (category: string) => void;
}

function getSlideIndex(category: string | undefined, categories: Category[]) {
  const index = categories.findIndex((item) => item.slug === category);
  return index >= 0 ? index : 0;
}

const pad = (value: number) => String(value).padStart(2, "0");

export default function ProductsCategorySpotlight({
  activeCategory,
  categories,
  onCategoryChange
}: ProductsCategorySpotlightProps) {
  const { direction, language } = useStorefrontLanguage();
  const copy = getStorefrontCopy(language);
  const slides = categories.map((category) => ({
    id: category.id,
    category: category.slug,
    description: resolveLocalizedText(category.description, language),
    headline: resolveLocalizedText(category.headline, language),
    badgeLabel:
      resolveLocalizedText(category.collectionLabel, language).replace(/\s+/g, " ").trim() ||
      resolveLocalizedText(category.name, language),
    link: getCategoryHref(language, category.slug)
  }));
  const [currentSlide, setCurrentSlide] = useState(() => getSlideIndex(activeCategory, categories));
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const nextSlideIndex = getSlideIndex(activeCategory, categories);
    setCurrentSlide((prev) => (prev === nextSlideIndex ? prev : nextSlideIndex));
  }, [activeCategory, categories]);

  useEffect(
    () => () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    },
    []
  );

  if (categories.length === 0) {
    return null;
  }

  const activateSlide = (nextIndex: number) => {
    if (isAnimating || nextIndex === currentSlide) return;

    setIsAnimating(true);
    setCurrentSlide(nextIndex);
    onCategoryChange?.(slides[nextIndex].category);

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    animationTimeoutRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      animationTimeoutRef.current = null;
    }, 500);
  };

  const nextSlide = () => {
    activateSlide((currentSlide + 1) % slides.length);
  };

  const prevSlide = () => {
    activateSlide((currentSlide - 1 + slides.length) % slides.length);
  };

  const navButton =
    "border-border text-foreground hover:bg-foreground/5 focus-visible:outline-accent flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40";

  return (
    <section className="bg-secondary relative w-full overflow-hidden pt-14 lg:pt-20" dir={direction}>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-32 sm:px-6 lg:px-8 lg:pb-40">
        {/* Navigation rail: hairline, position in the set, prev/next. */}
        <div className="flex items-center gap-4 sm:gap-6">
          <span aria-hidden="true" className="bg-border h-px flex-1" />
          <span
            aria-live="polite"
            className="font-spec text-muted-foreground text-[11px] tracking-[0.14em] whitespace-nowrap uppercase"
          >
            {pad(currentSlide + 1)} / {pad(slides.length)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              aria-label={copy.productsSpotlight.previousCategory}
              disabled={isAnimating}
              className={navButton}
            >
              {direction === "rtl" ? (
                <ChevronRight className="h-4 w-4 stroke-[1.5]" />
              ) : (
                <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
              )}
            </button>
            <button
              onClick={nextSlide}
              aria-label={copy.productsSpotlight.nextCategory}
              disabled={isAnimating}
              className={navButton}
            >
              {direction === "rtl" ? (
                <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
              ) : (
                <ChevronRight className="h-4 w-4 stroke-[1.5]" />
              )}
            </button>
          </div>
        </div>

        {/* Slides are absolutely stacked so switching category cannot shift the
            page height when descriptions differ in length. */}
        <div className="relative mt-10 min-h-[330px] sm:min-h-[300px] md:min-h-[240px] lg:mt-12">
          {slides.map((s, idx) => (
            <div
              key={`text-${s.id}`}
              aria-hidden={idx !== currentSlide}
              className={cn(
                "absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                idx === currentSlide
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-3 opacity-0"
              )}
            >
              <span className="font-spec text-muted-foreground block text-[11px] tracking-[0.18em] uppercase">
                {s.badgeLabel}
              </span>

              <div className="mt-5 grid gap-6 md:grid-cols-[1.15fr_1fr] md:items-end md:gap-12 lg:gap-16">
                <h2 className="font-display text-foreground text-4xl tracking-[-0.028em] whitespace-pre-line text-balance sm:text-5xl lg:text-6xl leading-[0.96]">
                  {s.headline}
                </h2>

                <div>
                  <p className="font-body text-muted-foreground max-w-[46ch] text-[15px] text-pretty leading-[1.7]">
                    {s.description}
                  </p>

                  <Link
                    href={`${s.link}#product-results`}
                    className="group focus-visible:outline-accent mt-6 inline-flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-4"
                    tabIndex={idx === currentSlide ? 0 : -1}
                  >
                    <span className="font-spec text-foreground relative pb-1 text-[11px] tracking-[0.16em] uppercase">
                      {copy.productsSpotlight.browseCategory}
                      <span
                        aria-hidden="true"
                        className="bg-accent absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 motion-reduce:transition-none rtl:origin-right"
                      />
                    </span>
                    <ArrowGlyph className="text-foreground" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-10 h-[132px] overflow-hidden sm:h-[168px] md:h-[188px] lg:h-[224px] xl:h-[248px]">
        <div className="absolute inset-x-[-5%] bottom-[54%] h-8 bg-gradient-to-b from-black/20 via-black/10 to-transparent blur-2xl sm:h-10 lg:h-14" />

        <svg
          className="text-background absolute inset-x-[-5%] bottom-0 block h-full w-[110%]"
          viewBox="0 0 1440 260"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="fill-current opacity-[0.56]"
            transform="translate(0 72)"
            d="M0 166C224 154 482 160 760 150C1042 138 1248 112 1440 144V260H0V166Z"
          />
          <path
            className="fill-current"
            transform="translate(0 72)"
            d="M0 208C224 196 482 202 760 192C1042 180 1248 154 1440 186V260H0V208Z"
          />
        </svg>
      </div>
    </section>
  );
}
