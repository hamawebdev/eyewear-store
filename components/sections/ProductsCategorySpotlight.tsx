"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import { getCategoryHref } from "@/lib/category-href";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import type { Category } from "@/lib/schemas";
import { resolveLocalizedText } from "@/lib/storefront-language";
import { shouldSkipImageOptimization } from "@/lib/storefront-image";

interface ProductsCategorySpotlightProps {
  activeCategory?: string;
  categories: Category[];
  onCategoryChange?: (category: string) => void;
}

function getSlideIndex(category: string | undefined, categories: Category[]) {
  const index = categories.findIndex((item) => item.slug === category);
  return index >= 0 ? index : 0;
}

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
      resolveLocalizedText(category.outlinedPill, language).replace(/\s+/g, " ").trim() ||
      resolveLocalizedText(category.name, language),
    image: category.image,
    link: getCategoryHref(category.slug),
    name: resolveLocalizedText(category.name, language),
    backgroundImage: category.backgroundImage
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

  return (
    <section
      className="relative flex min-h-[600px] w-full items-center overflow-hidden bg-[#ecf2f6] pt-10 md:min-h-[700px] lg:pt-20"
      dir={direction}
    >
      {/* Background Images - Crossfade */}
      {slides.map((s, idx) => (
        <div
          key={`bg-${s.id}`}
          className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-700 ease-in-out ${idx === currentSlide ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={s.backgroundImage.src}
            alt=""
            fill
            className="object-cover opacity-60 mix-blend-multiply sm:opacity-75"
            priority
            sizes="100vw"
            unoptimized={shouldSkipImageOptimization(s.backgroundImage.src)}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f5ebd9]/80 via-[#f7f1e6]/70 to-[#faf7f2]/95"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#d4b06a]/20 via-transparent to-[#ffffff]/10"></div>
        </div>
      ))}

      {/* Main Content Container */}
      <div className="relative z-10 container mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between pt-10 pb-32 md:flex-row">
        {/* Left Side: Image Carousel */}
        <div className="relative flex h-full min-h-[350px] w-full items-center justify-center p-6 md:min-h-[500px] md:w-1/2 lg:p-12">
          {slides.map((s, idx) => (
            <div
              key={`img-${s.id}`}
              className={`absolute inset-0 flex transform items-center justify-center transition-all duration-700 ease-in-out ${idx === currentSlide
                ? "translate-x-0 scale-100 opacity-100"
                : idx < currentSlide
                  ? "-translate-x-12 scale-95 opacity-0"
                  : "translate-x-12 scale-95 opacity-0"
                }`}
            >
              <div className="relative aspect-[3/4] h-full max-h-[450px] w-full max-w-[320px] md:max-h-[550px] md:max-w-[420px]">
                <Image
                  src={s.image.src}
                  alt={s.image.alt}
                  fill
                  className="object-contain drop-shadow-[0_35px_35px_rgba(0,40,20,0.15)]"
                  sizes="(max-width: 768px) 80vw, 420px"
                  priority
                  unoptimized={shouldSkipImageOptimization(s.image.src)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Text Content Carousel */}
        <div className="relative flex min-h-[350px] w-full flex-col items-start justify-center p-6 md:w-1/2 lg:p-12 rtl:items-end">
          {slides.map((s, idx) => (
            <div
              key={`text-${s.id}`}
              className={`absolute inset-0 flex transform flex-col items-start justify-center p-6 transition-all duration-700 ease-in-out lg:p-12 rtl:items-end ${idx === currentSlide
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-8 opacity-0"
                }`}
            >
              <div className="mb-6 inline-flex items-center rounded-full border-2 border-[#173a2a] bg-transparent px-5 py-2 text-[0.95rem] font-semibold tracking-[0.24em] text-[#173a2a] uppercase">
                {s.badgeLabel}
              </div>

              <h1 className="mb-6 max-w-[15ch] font-serif text-[2.75rem] leading-[1.05] font-black tracking-tight whitespace-pre-line text-[#24412d] md:text-5xl lg:text-7xl">
                {s.headline}
              </h1>

              <p className="mb-10 max-w-[38ch] text-lg leading-relaxed whitespace-pre-line font-medium text-[#24412d]/80 md:text-[1.15rem]">
                {s.description}
              </p>

              <Link
                href={`${s.link}#product-results`}
                className="group inline-flex items-center text-lg font-bold tracking-wide text-[#24412d] transition-all hover:opacity-75"
                tabIndex={idx === currentSlide ? 0 : -1}
              >
                <span className="relative">
                  {copy.productsSpotlight.browseCategory}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 transform bg-current transition-transform duration-300 group-hover:scale-x-100`}
                  ></span>
                </span>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  className="ml-3 transition-transform duration-300 group-hover:translate-x-2 rtl:mr-3 rtl:ml-0 rtl:rotate-180 rtl:group-hover:-translate-x-2 rtl:group-hover:translate-x-0"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.3839 17.8839C13.8957 18.372 13.1043 18.372 12.6161 17.8839L8.24067 13.5084C7.40758 12.6753 7.40759 11.3246 8.24068 10.4916L12.6161 6.11612C13.1043 5.62796 13.8957 5.62796 14.3839 6.11612C14.872 6.60427 14.872 7.39573 14.3839 7.88388L10.2678 12L14.3839 16.1161C14.872 16.6043 14.872 17.3957 14.3839 17.8839Z"
                  ></path>
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="pointer-events-none absolute bottom-16 left-1/2 z-20 flex w-full max-w-[1440px] -translate-x-1/2 justify-end gap-4 px-6 md:bottom-28 lg:px-12">
        <button
          onClick={prevSlide}
          aria-label={copy.productsSpotlight.previousCategory}
          disabled={isAnimating}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-black/20 text-[#0a2f1f] transition-colors hover:bg-black/5"
        >
          {direction === "rtl" ? (
            <ChevronRight className="h-5 w-5 stroke-[1.5]" />
          ) : (
            <ChevronLeft className="h-5 w-5 stroke-[1.5]" />
          )}
        </button>
        <button
          onClick={nextSlide}
          aria-label={copy.productsSpotlight.nextCategory}
          disabled={isAnimating}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-black/20 text-[#0a2f1f] transition-colors hover:bg-black/5"
        >
          {direction === "rtl" ? (
            <ChevronLeft className="h-5 w-5 stroke-[1.5]" />
          ) : (
            <ChevronRight className="h-5 w-5 stroke-[1.5]" />
          )}
        </button>
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
