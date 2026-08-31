import Link from "next/link";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import type { StorefrontLanguage } from "@/lib/storefront-language";
import HeroVideo from "./HeroVideo";

export default function Hero({ language }: { language: StorefrontLanguage }) {
  const copy = getStorefrontCopy(language);

  return (
    <section className="relative w-full bg-background">
      <div className="relative isolate h-hero-viewport w-full overflow-hidden">
        {/* Poster image shown immediately; video hydrates client-side.
            This <img> is the page's LCP element, so it is preloaded with
            fetchpriority="high" in app/layout.tsx — keep the two in sync.
            WebP first (about half the bytes of the JPEG at the same quality);
            the JPEG stays only as a fallback for engines without WebP. */}
        <picture>
          <source
            type="image/webp"
            srcSet="/hero-poster-mobile.webp"
            media="(max-width: 767px)"
          />
          <source
            type="image/jpeg"
            srcSet="/hero-poster-mobile.jpg"
            media="(max-width: 767px)"
          />
          <source type="image/webp" srcSet="/hero-poster.webp" />
          <img
            src="/hero-poster.jpg"
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 z-0 h-full w-full object-cover"
          />
        </picture>
        <HeroVideo />
        {/* Mobile footage is a bright cream scene; this scrim keeps the white
            heading legible. Desktop footage is already dark, so it is exempt. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/35 via-black/50 to-black/45 md:hidden"
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center sm:px-10 lg:px-14">
          <h1 className="max-w-4xl font-serif text-5xl font-black leading-[0.95] tracking-tight text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl">
            {copy.hero.headingLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-4 sm:mt-9 sm:gap-6">
            {/* Locale-prefixed: a bare `/products` would be 307'd by
                middleware.ts, costing an extra round trip on every click and
                wasting the prefetch. */}
            <Link
              href={`/${language}/products`}
              className="bg-accent text-accent-foreground hover:bg-accent/90 inline-flex items-center gap-3 rounded-full px-7 py-3 text-lg font-semibold sm:px-9 sm:py-4 sm:text-2xl"
            >
              {copy.hero.cta}
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-10 h-[132px] overflow-hidden sm:h-[168px] md:h-[188px] lg:h-[224px] xl:h-[248px]">
          <div className="absolute inset-x-[-5%] bottom-[54%] h-8 bg-gradient-to-b from-black/20 via-black/10 to-transparent blur-2xl sm:h-10 lg:h-14" />

          <svg
            className="absolute inset-x-[-5%] bottom-0 block h-full w-[110%] text-background"
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
      </div>
    </section>
  );
}
