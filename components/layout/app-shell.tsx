"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import { StorefrontLanguageProvider, useStorefrontLanguage } from "@/components/storefront-language-provider";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { getStorefrontHtmlLang, type StorefrontLanguage } from "@/lib/storefront-language";

/**
 * Fade the new page in, never the old one out.
 *
 * This used to hold the already-rendered new page at `opacity: 0` for 120 ms and
 * only then fade it in over 200 ms — about a third of a second of pure added
 * latency on every navigation, on top of whatever the route itself cost. The
 * `key` restarts a CSS animation on each pathname change, so the content paints
 * as soon as React commits it.
 */
function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-fade-in">
      {children}
    </div>
  );
}

function StorefrontShell({ children }: { children: React.ReactNode }) {
  const { direction, language } = useStorefrontLanguage();

  return (
    <div
      className="storefront-shell min-h-screen"
      data-language={language}
      dir={direction}
      lang={getStorefrontHtmlLang(language)}
    >
      <Navbar />
      <div className="bg-background text-foreground min-h-screen">
        <PageTransition>{children}</PageTransition>
      </div>
      <Footer />
    </div>
  );
}

export default function AppShell({
  children,
  initialLanguage
}: {
  children: React.ReactNode;
  initialLanguage: StorefrontLanguage;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <StorefrontLanguageProvider initialLanguage={initialLanguage}>
      <StorefrontShell>{children}</StorefrontShell>
    </StorefrontLanguageProvider>
  );
}
