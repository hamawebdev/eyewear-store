"use client";

import LocalizedLink from "@/components/localized-link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import { useState, useEffect } from "react";
import { BurgerMenu } from "@/components/mvpblocks/burger-menu";
import { FullScreenMenu } from "@/components/mvpblocks/full-screen-menu";
import LanguageSwitcher from "@/components/layout/language-switcher";
import { getStorefrontCopy } from "@/lib/storefront-copy";

export default function Navbar() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const itemCount = useCartStore((state) => state.getItemCount());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { language } = useStorefrontLanguage();
  const copy = getStorefrontCopy(language);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu on route change (back/forward navigation)
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <div className={isHomepage ? "homepage-serif" : undefined}>
      <FullScreenMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <header
        className="fixed top-0 left-0 right-0 z-[110] pointer-events-none p-4 sm:p-6 lg:p-8"
        dir="ltr"
      >
        <div className="mx-auto max-w-screen-2xl flex justify-between items-start">
          {/* Left Menu Button */}
          <BurgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />

          {/* Right Pills (Language + Cart) */}
          <div className="pointer-events-auto flex items-center gap-3">
            <LanguageSwitcher />
            <LocalizedLink
              href="/cart"
              aria-label={copy.navbar.cartAriaLabel}
              className="flex items-center justify-center bg-white rounded-full shadow-[0_4px_24px_rgb(0,0,0,0.12)] p-[14px] relative hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <ShoppingCart className="h-[22px] w-[22px] text-slate-800 group-hover:text-teal-900 transition-colors" />
              {mounted && itemCount > 0 && (
                <span className="bg-[#fbbf24] absolute -top-1.5 -right-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-bold text-slate-900 shadow-sm border-2 border-white">
                  {itemCount}
                </span>
              )}
            </LocalizedLink>
          </div>
        </div>
      </header>
    </div>
  );
}
