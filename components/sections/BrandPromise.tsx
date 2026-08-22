import { BRAND } from "@/lib/brand";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import { getStorefrontDirection } from "@/lib/storefront-language";
import { getServerStorefrontLanguage } from "@/lib/storefront-language.server";
import { cn } from "@/lib/utils";

/**
 * The promise is set as an optician's acuity chart: the claims descend in scale
 * the way the rows of a Snellen chart do. The order is the brand's own — Herizi
 * competes on UV protection rather than on price (see brand-info.md) — so the
 * descent carries that priority instead of decorating it.
 *
 * Sizes stay comfortably readable at every step; this is a chart as a typographic
 * device, not a legibility test.
 */
const CLAIM_SCALE = [
  "text-[1.75rem] sm:text-4xl lg:text-[3.5rem]",
  "text-[1.375rem] sm:text-[1.75rem] lg:text-[2.4rem]",
  "text-[1.0625rem] sm:text-xl lg:text-[1.6rem]"
];

export default async function BrandPromise() {
  const language = await getServerStorefrontLanguage();
  const copy = getStorefrontCopy(language);
  const brandMark = language === "ar" ? BRAND.nameAr : BRAND.name;

  return (
    <section
      className="bg-background py-20 sm:py-24 lg:py-32"
      dir={getStorefrontDirection(language)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Chart header: a hairline interrupted by the brand mark. */}
        <div className="flex items-center gap-5 sm:gap-8">
          <span aria-hidden="true" className="bg-border h-px flex-1" />
          <span className="font-spec text-muted-foreground text-[11px] tracking-[0.28em] uppercase">
            {brandMark}
          </span>
          <span aria-hidden="true" className="bg-border h-px flex-1" />
        </div>

        {/* One sentence, set as three chart rows. */}
        <p className="text-foreground mx-auto mt-12 max-w-5xl space-y-3 text-center sm:mt-16 sm:space-y-4 lg:space-y-5">
          {copy.brandPromise.claims.map((claim, index) => (
            <span
              key={claim}
              className={cn(
                "block tracking-[-0.02em] text-balance",
                CLAIM_SCALE[index] ?? CLAIM_SCALE[CLAIM_SCALE.length - 1],
                // Must follow the text-* classes: tailwind-merge treats font-size
                // as conflicting with leading and drops any leading before it.
                "leading-[1.1]"
              )}
            >
              {claim}
            </span>
          ))}
        </p>

        <span
          aria-hidden="true"
          className="bg-border mt-12 block h-px sm:mt-16 lg:mt-20"
        />
      </div>
    </section>
  );
}
