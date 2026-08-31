import type { Metadata } from "next";
import "./globals.css";

/**
 * There is no shared root layout any more (the storefront and the admin each own
 * one), so Next has nothing to wrap a 404 in for a path that matches neither
 * tree. `experimental.globalNotFound` in next.config.ts points it here, and this
 * file therefore has to render its own <html>/<body>.
 *
 * In practice almost nothing reaches this: middleware.ts redirects every
 * locale-less storefront path to `/<locale>/...`, so ordinary 404s land in
 * app/[locale]/not-found.tsx with the navbar and footer around them.
 */
export const metadata: Metadata = {
  title: "404 - Page not found",
  robots: { index: false, follow: false }
};

export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-spec text-muted-foreground text-[11px] tracking-[0.2em] uppercase">
            404
          </p>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Page not found</h1>
          {/* A plain anchor on purpose. This page is reached for URLs that
              match neither root layout, so a client-side transition into the
              storefront tree is not possible — the browser has to do a full
              navigation, which also lets middleware.ts pick the locale. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Go to the homepage
          </a>
        </main>
      </body>
    </html>
  );
}
