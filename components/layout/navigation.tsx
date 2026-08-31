"use client";

import React from "react";
import LocalizedLink from "@/components/localized-link";
import type { Category } from "@/lib/schemas";
import { getCategoryHref } from "@/lib/category-href";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import { resolveLocalizedText } from "@/lib/storefront-language";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu";

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <LocalizedLink href={href}>
          <div className="mb-1 text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug whitespace-pre-line">
            {children}
          </p>
        </LocalizedLink>
      </NavigationMenuLink>
    </li>
  );
}

export default function Navigation({ categories }: { categories: Category[] }) {
  const { language } = useStorefrontLanguage();
  const copy = getStorefrontCopy(language);
  const nav = copy.navigation;

  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>{nav.shop}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <LocalizedLink
                    className="from-primary to-accent relative flex h-full w-full flex-col justify-end overflow-hidden rounded-md bg-gradient-to-br p-0! no-underline outline-hidden select-none focus:shadow-md [transform:translateZ(0)]"
                    href="/products"
                  >
                    <div className="text-primary-foreground space-y-2 p-4">
                      <div className="font-medium">{nav.featured.title}</div>
                      <p className="text-sm leading-tight">{nav.featured.body}</p>
                    </div>
                  </LocalizedLink>
                </NavigationMenuLink>
              </li>
              {nav.highlights.map((highlight) => (
                <ListItem
                  key={highlight.slug}
                  href={getCategoryHref(language, highlight.slug)}
                  title={highlight.title}
                >
                  {highlight.body}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>{copy.categories.title}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-2 md:grid-cols-2 lg:w-[550px]">
              {categories.map((category) => (
                <ListItem
                  key={category.slug}
                  title={resolveLocalizedText(category.name, language)}
                  href={getCategoryHref(language, category.slug)}
                >
                  {resolveLocalizedText(category.description, language)}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>{nav.quickLinks}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[300px] gap-4">
              <li>
                <NavigationMenuLink asChild>
                  <LocalizedLink href="/products">
                    <div className="font-medium">{nav.allProducts.title}</div>
                    <div className="text-muted-foreground">{nav.allProducts.body}</div>
                  </LocalizedLink>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <LocalizedLink href="/contact">
                    <div className="font-medium">{nav.faq.title}</div>
                    <div className="text-muted-foreground">{nav.faq.body}</div>
                  </LocalizedLink>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <LocalizedLink href="/contact">
                    <div className="font-medium">{nav.guide.title}</div>
                    <div className="text-muted-foreground">{nav.guide.body}</div>
                  </LocalizedLink>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
