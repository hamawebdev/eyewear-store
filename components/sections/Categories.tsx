import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCategoryHref } from "@/lib/category-href";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import { getAllStorefrontCategories } from "@/lib/payload/categories";
import {
  getStorefrontDirection,
  resolveLocalizedText
} from "@/lib/storefront-language";
import { getServerStorefrontLanguage } from "@/lib/storefront-language.server";
import { shouldSkipImageOptimization } from "@/lib/storefront-image";
import FadeUpInView from "@/components/ui/fade-up-in-view";

const MASKS_SVG_PATH =
  "M2.47115 349.255C3.08253 355.896 3.8651 362.516 4.57431 369.165C4.95948 372.806 5.24071 376.468 5.74204 380.08C6.70803 387.025 7.7433 393.956 8.84786 400.872C9.99726 408.132 11.1283 415.4 12.4856 422.617C13.8918 430.112 15.5425 437.55 17.1199 445.002C18.3976 451.018 19.7121 457.005 22.8546 462.21C26.6428 468.38 31.4864 473.573 37.0815 477.463C47.1693 484.652 58.3087 487.632 69.9677 487.866C83.2592 488.129 96.5628 487.923 109.854 487.923C145.416 487.923 180.978 487.923 216.54 487.923C264.534 487.923 312.525 487.923 360.515 487.923C373.574 487.923 385.777 484.368 396.935 476.247C404.381 470.822 409.866 463.398 412.929 453.99C415.093 447.349 416.316 440.266 417.655 433.305C419.75 422.402 421.7 411.475 423.505 400.524C424.795 392.702 425.878 384.816 426.831 376.923C428.017 367.096 429.124 357.24 429.992 347.363C430.714 339.179 431.307 330.951 431.49 322.738C431.845 306.576 432.101 290.398 431.961 274.228C431.881 263.228 431.233 252.185 430.598 241.234C430.151 233.512 429.375 225.811 428.623 218.117C428.011 211.888 427.4 205.651 426.575 199.465C425.45 191.117 424.166 182.797 422.863 174.485C421.946 168.675 420.98 162.873 419.862 157.113C418.407 149.625 416.866 142.18 415.191 134.728C413.185 125.825 411.137 116.951 408.851 108.126C406.564 99.3017 403.96 90.4061 401.38 81.5957C400.291 77.8768 399.295 74.0085 397.613 70.6451C393.893 62.9436 387.954 57.0178 380.843 53.9133C375.243 51.4671 369.472 49.5188 363.725 47.5135C357.36 45.2665 350.947 43.1901 344.552 41.0355C338.364 38.9521 332.165 36.8899 325.978 34.778C317.602 31.9337 309.238 29.004 300.862 26.1455C292.725 23.3722 284.563 20.6914 276.407 17.8969C269.443 15.5005 262.529 12.9193 255.547 10.5656C246.987 7.72127 238.33 4.9836 229.728 2.1606C222.538 -0.166373 214.996 -0.620396 207.639 0.830875C203.5 1.61307 199.44 3.04946 195.411 4.38629C188.074 6.75657 180.752 9.20744 173.444 11.7389C164.426 14.8179 155.433 17.9893 146.421 21.0754C139.207 23.5429 131.968 25.8966 124.754 28.364C116.433 31.2084 108.13 34.138 99.8093 37.0037C93.5813 39.1417 87.3412 41.256 81.0888 43.3466C76.644 44.8398 72.1809 46.2549 67.7484 47.7837C61.1638 49.9312 54.4386 51.652 48.3798 55.5772C41.7463 59.8437 36.0849 65.319 33.3643 73.8663C30.9188 81.5389 28.6689 89.2968 26.5351 97.0903C23.8634 106.868 21.1856 116.659 18.899 126.565C16.2762 137.906 14.0079 149.369 11.7152 160.818C10.5536 166.634 9.67323 172.529 8.78061 178.41C7.46614 187.085 6.12721 195.76 5.02673 204.471C4.17691 211.191 3.53496 217.982 3.04585 224.737C2.07987 238.183 1.00995 251.637 0.478043 265.112C-0.378066 288.318 -0.0841139 311.561 1.35843 334.727C1.64578 339.556 2.0065 344.398 2.47115 349.255Z";

const MASK_SVG_DATA_URI = `data:image/svg+xml;charset=utf-8,%3Csvg width='432' height='488' viewBox='0 0 432 488' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='${MASKS_SVG_PATH}' fill='black'/%3E%3C/svg%3E`;

const cardStyles = [
  {
    bgColor: "#dce7ec"
  },
  {
    bgColor: "#e3e7ea"
  },
  {
    bgColor: "#cfe3e9"
  },
  {
    bgColor: "#e7eaed"
  }
];

export default async function Categories() {
  const language = await getServerStorefrontLanguage();
  const copy = getStorefrontCopy(language);
  const featuredCategories = await getAllStorefrontCategories();

  return (
    <section
      className="bg-background py-24 sm:py-32"
      dir={getStorefrontDirection(language)}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative mb-12 text-center md:mb-16">
          <h2 className="from-foreground to-foreground/40 mb-4 bg-gradient-to-b bg-clip-text text-3xl font-bold text-transparent md:text-5xl lg:text-6xl">
            {copy.categories.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 lg:gap-x-16 lg:gap-y-24">
          {featuredCategories.map((category, index) => {
            const style = cardStyles[index % cardStyles.length];
            const gradId = `mask-gradient-${index}`;

            return (
              <FadeUpInView
                key={category.slug}
                delay={index * 0.08}
                amount={0.15}
                className="mx-auto w-full max-w-[432px]"
              >
                <Link
                  href={getCategoryHref(category.slug)}
                  className="group relative block aspect-[432/488] w-full text-center"
                >
                  {/* Shape Mask Container */}
                  <div className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-[1.02]">
                    {/* CSS Masked Background Image (Safari/WebKit Compatible) */}
                    <div
                      className="absolute inset-0 h-full w-full"
                      style={{
                        WebkitMaskImage: `url("${MASK_SVG_DATA_URI}")`,
                        WebkitMaskSize: "100% 100%",
                        WebkitMaskRepeat: "no-repeat",
                        maskImage: `url("${MASK_SVG_DATA_URI}")`,
                        maskSize: "100% 100%",
                        maskRepeat: "no-repeat",
                      }}
                    >
                      <Image
                        src={category.backgroundImage.src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 432px"
                        loading="lazy"
                        unoptimized={shouldSkipImageOptimization(category.backgroundImage.src)}
                      />
                    </div>

                    {/* Gradient Overlay & Drop Shadow */}
                    <svg
                      viewBox="0 0 432 488"
                      xmlns="http://www.w3.org/2000/svg"
                      className="pointer-events-none absolute inset-0 z-10 h-full w-full drop-shadow-sm"
                    >
                      <defs>
                        <linearGradient
                          id={gradId}
                          x1="216"
                          y1="0"
                          x2="216"
                          y2="488"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor={style.bgColor} stopOpacity="0.64" />
                          <stop offset="0.666667" stopColor={style.bgColor} />
                        </linearGradient>
                      </defs>

                      {/* Gradient placed EXACTLY over the masked boundaries */}
                      <path d={MASKS_SVG_PATH} fill={`url(#${gradId})`} />
                    </svg>
                  </div>

                  {/* Content Container */}
                  <div className="relative z-10 flex h-full flex-col items-center justify-start px-6 pt-0 pb-12">
                    {/* Product Image */}
                    <div className="relative mb-6 h-[420px] w-[380px] drop-shadow-[0_15px_30px_rgba(0,0,0,0.12)] transition-transform duration-500 group-hover:-translate-y-2 sm:h-[500px] sm:w-[450px]">
                      <Image
                        src={category.image.src}
                        alt={category.image.alt}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 380px, 450px"
                        loading="lazy"
                        unoptimized={shouldSkipImageOptimization(category.image.src)}
                      />
                    </div>

                    {/* Title */}
                    <h3 className="max-w-[280px] font-serif text-[28px] leading-tight font-bold tracking-tight text-[#10151a] sm:text-[32px]">
                      {resolveLocalizedText(category.name, language)}
                    </h3>

                    {/* Button */}
                    <button
                      aria-label={`${copy.categories.moreInfo}: ${resolveLocalizedText(category.name, language)}`}
                      type="button"
                      className="mt-6 flex h-11 w-11 items-center justify-center rounded-full border border-[#10151a]/20 bg-transparent text-[#10151a] transition-all duration-300 group-hover:border-[#10151a]/40 group-hover:bg-[#10151a]/5 sm:h-12 sm:w-12"
                    >
                      <ChevronRight className="h-5 w-5 stroke-[2] transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0" />
                    </button>
                  </div>
                </Link>
              </FadeUpInView>
            );
          })}
        </div>
      </div>
    </section>
  );
}
