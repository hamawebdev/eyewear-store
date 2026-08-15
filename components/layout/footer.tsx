"use client";
import { usePathname } from "next/navigation";
import Logo from "@/components/logo";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import { getStorefrontCopy } from "@/lib/storefront-copy";

export default function Footer() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const { direction, language } = useStorefrontLanguage();
  const copy = getStorefrontCopy(language);

  return (
    <footer className={`border-t ${isHomepage ? "homepage-serif" : ""}`.trim()}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="space-y-4">
              <Logo />
              <p className="text-muted-foreground mb-6 max-w-md">
                {copy.footer.description}
              </p>
            </div>
          </div>
        </div>

        <div className="text-muted-foreground mt-8 border-t border-gray-200 pt-8 text-center">
          <p>
            &copy; Roya {new Date().getFullYear()} {copy.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
