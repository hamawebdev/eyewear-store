"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { StorefrontLanguageProvider, useStorefrontLanguage } from "@/components/storefront-language-provider";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { getStorefrontHtmlLang, type StorefrontLanguage } from "@/lib/storefront-language";

function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayKey, setDisplayKey] = useState(pathname);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (pathname !== displayKey) {
      setIsVisible(false);
      // Short delay for fade-out, then swap content and fade-in
      const timer = setTimeout(() => {
        setDisplayKey(pathname);
        setIsVisible(true);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [pathname, displayKey]);

  return (
    <div
      className="transition-opacity duration-200 ease-out"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
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
