import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

/**
 * Next serves everything in `public/` with `Cache-Control: public, max-age=0`,
 * so repeat visitors revalidated the hero poster, the hero footage and both
 * webfonts on every navigation. These assets only ever change when we ship a
 * replacement, so they get a one-year immutable cache.
 *
 * The trade-off that buys: an asset listed here can no longer be updated in
 * place. To change one, ship it under a NEW filename (e.g. `hero-poster-v2.webp`)
 * and update the references — overwriting the existing file would leave it
 * cached in visitors' browsers for up to a year.
 */
const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

const IMMUTABLE_PUBLIC_FILES = [
  "/hero-poster.webp",
  "/hero-poster.jpg",
  "/hero-poster-mobile.webp",
  "/hero-poster-mobile.jpg",
  "/eyewear-desktop-hero.av1.webm",
  "/eyewear-desktop-hero.mp4",
  "/eyewear-mobile-hero.av1.webm",
  "/eyewear-mobile-hero.mp4",
];

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: "/fonts/:file*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE_CACHE_CONTROL }],
      },
      ...IMMUTABLE_PUBLIC_FILES.map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: IMMUTABLE_CACHE_CONTROL }],
      })),
    ];
  },
  // Skip linting & type-checking during production builds (already validated locally / in CI)
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    // WebP only. AVIF is 5-20x slower to encode than WebP for a marginal size
    // win, and every product image is optimized on demand on a host that is
    // already oversubscribed — the encode was showing up as multi-second image
    // loads on the category grid.
    formats: ["image/webp"],
    // Every distinct width is a separate on-demand encode from a 3000x2000
    // source (~0.75s each on this host) and a separate cache entry, so a wide
    // ladder means visitors keep missing each other's cached variants. These are
    // the rungs the storefront's `sizes` attributes actually land on:
    //   640/828  - cards and the product image on phones
    //   1200     - the product image at 50vw on a desktop viewport
    //   1920     - retina desktop, and the `src` fallback
    // Dropping 750 and 1080 costs at most one rung of sharpness on a few
    // viewports and removes a third of the variants.
    deviceSizes: [640, 828, 1200, 1920],
    // Only the gallery thumbnails use these (120px display, so 128 at 1x and
    // 256 at 2x); 384 covers the 25vw phone layout.
    imageSizes: [128, 256, 384],
    // app/media/[...filename]/route.ts already serves uploads as
    // `immutable, max-age=31536000`, so optimized variants can be held for as
    // long as the on-disk cache survives.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
      },
    ],
  },
  experimental: {
    // Reduce webpack memory footprint — critical for Payload admin bundling
    webpackMemoryOptimizations: true,
    // The storefront and the admin each own a root layout now, so there is no
    // shared layout for Next to wrap a 404 in when a path matches neither tree.
    // This points those at app/global-not-found.tsx.
    globalNotFound: true,
  },
  webpack: (config) => {
    // Allow resolving .js extensions to .ts files for ESM compatibility
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  }
};


export default withPayload(nextConfig);
