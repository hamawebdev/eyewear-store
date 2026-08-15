"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import type { Category, Product } from "@/lib/schemas";
import ProductCard from "@/components/ProductCard";
import ProductsCategorySpotlight from "@/components/sections/ProductsCategorySpotlight";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { FRAME_COLORS, FRAME_SHAPES, GENDERS } from "@/lib/eyewear";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import { resolveLocalizedText } from "@/lib/storefront-language";

const getTimestamp = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getFeaturedRank = (product: Product) => product.featuredRank ?? Number.MAX_SAFE_INTEGER;

/** Price bands in DZD, matched to the catalogue rather than the old USD buckets. */
const PRICE_RANGES: Record<string, (price: number) => boolean> = {
  "under-3000": (price) => price < 3000,
  "3000-6000": (price) => price >= 3000 && price <= 6000,
  "6000-10000": (price) => price > 6000 && price <= 10000,
  "over-10000": (price) => price > 10000
};

/**
 * Reads a repeatable facet from the URL (`?shape=round,aviator`), keeping only
 * values the catalogue actually defines.
 */
const parseFacetParam = (raw: null | string, allowed: readonly string[]) => {
  if (!raw) {
    return [];
  }

  const allowedSet = new Set(allowed);

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => allowedSet.has(value));
};

const toggleValue = (values: string[], value: string) =>
  values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];

export default function ProductsPageClient({
  categories,
  products
}: {
  categories: Category[];
  products: Product[];
}) {
  const { direction, language } = useStorefrontLanguage();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const copy = getStorefrontCopy(language);
  const attributeCopy = copy.productAttributes;
  const categoryOptions = useMemo(
    () => [
      { value: "all", label: copy.productsPage.allCategories },
      ...categories.map((category) => ({
        label: resolveLocalizedText(category.name, language),
        value: category.slug
      }))
    ],
    [categories, copy.productsPage.allCategories, language]
  );

  // Only offer facet values that at least one product actually carries, keeping
  // the canonical ordering from lib/eyewear.
  const availableShapes = useMemo(() => {
    const present = new Set(products.map((product) => product.frameShape).filter(Boolean));
    return FRAME_SHAPES.filter((shape) => present.has(shape));
  }, [products]);
  const availableGenders = useMemo(() => {
    const present = new Set(products.map((product) => product.gender).filter(Boolean));
    return GENDERS.filter((gender) => present.has(gender));
  }, [products]);
  const availableColors = useMemo(() => {
    const present = new Set(products.map((product) => product.frameColor).filter(Boolean));
    return FRAME_COLORS.filter((color) => present.has(color));
  }, [products]);

  const categoryFromQuery = searchParams.get("category");
  const shapeFromQuery = searchParams.get("shape");
  const genderFromQuery = searchParams.get("gender");
  const colorFromQuery = searchParams.get("color");

  useEffect(() => {
    if (!categoryFromQuery) {
      setSelectedCategory("all");
      return;
    }

    const isKnownCategory = categoryOptions.some(
      (category) => category.value === categoryFromQuery
    );
    setSelectedCategory(isKnownCategory ? categoryFromQuery : "all");
  }, [categoryFromQuery, categoryOptions]);

  useEffect(() => {
    setSelectedShapes(parseFacetParam(shapeFromQuery, FRAME_SHAPES));
  }, [shapeFromQuery]);

  useEffect(() => {
    setSelectedGenders(parseFacetParam(genderFromQuery, GENDERS));
  }, [genderFromQuery]);

  useEffect(() => {
    setSelectedColors(parseFacetParam(colorFromQuery, FRAME_COLORS));
  }, [colorFromQuery]);

  const hasActiveFilters =
    selectedCategory !== "all" ||
    priceRange !== "all" ||
    selectedShapes.length > 0 ||
    selectedGenders.length > 0 ||
    selectedColors.length > 0;

  const resetFilters = () => {
    setSelectedCategory("all");
    setPriceRange("all");
    setSelectedShapes([]);
    setSelectedGenders([]);
    setSelectedColors([]);
  };

  const filteredProducts = products
    .filter((product) => selectedCategory === "all" || product.category.slug === selectedCategory)
    .filter((product) => PRICE_RANGES[priceRange]?.(product.price) ?? true)
    .filter(
      (product) =>
        selectedShapes.length === 0 ||
        (product.frameShape != null && selectedShapes.includes(product.frameShape))
    )
    .filter(
      (product) =>
        selectedGenders.length === 0 ||
        (product.gender != null && selectedGenders.includes(product.gender))
    )
    .filter(
      (product) =>
        selectedColors.length === 0 ||
        (product.frameColor != null && selectedColors.includes(product.frameColor))
    )
    .sort((a, b) => {
      if (sortBy === "featured") {
        const featuredDifference = getFeaturedRank(a) - getFeaturedRank(b);

        if (featuredDifference !== 0) {
          return featuredDifference;
        }

        return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
      }

      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "newest") return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
      return 0;
    });

  const renderFacet = ({
    labels,
    onToggle,
    selected,
    title,
    values
  }: {
    labels: Record<string, string>;
    onToggle: (value: string) => void;
    selected: string[];
    title: string;
    values: readonly string[];
  }) => {
    if (values.length === 0) {
      return null;
    }

    return (
      <div>
        <h3 className="mb-3 text-sm font-medium tracking-wider text-gray-700 uppercase">{title}</h3>
        <div className="space-y-3">
          {values.map((value) => (
            <label key={value} className="flex items-center py-1">
              <input
                type="checkbox"
                value={value}
                checked={selected.includes(value)}
                onChange={() => onToggle(value)}
                className="text-primary focus:ring-ring mr-3 h-4 w-4 rtl:mr-0 rtl:ml-3"
              />
              <span className="text-sm text-gray-600">{labels[value] ?? value}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {selectedCategory !== "all" && (
        <ProductsCategorySpotlight
          activeCategory={selectedCategory}
          categories={categories}
          onCategoryChange={setSelectedCategory}
        />
      )}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1" id="product-results">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">{copy.productsPage.heading}</h1>

              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" onClick={resetFilters}>
                    {attributeCopy.reset}
                  </Button>
                )}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
                      {copy.productsPage.filterButton}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side={direction === "rtl" ? "left" : "right"}
                    className="w-[280px] sm:w-[320px]"
                  >
                    <SheetHeader>
                      <SheetTitle className="text-lg">{copy.productsPage.filterTitle}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-6 overflow-y-auto px-4 pb-8">
                      <div>
                        <h3 className="mb-3 text-sm font-medium tracking-wider text-gray-700 uppercase">
                          {copy.productsPage.sortBy}
                        </h3>
                        <div className="space-y-3">
                          {[
                            { value: "featured", label: copy.productsPage.sortFeatured },
                            { value: "newest", label: copy.productsPage.sortNewest },
                            { value: "price-low", label: copy.productsPage.priceLow },
                            { value: "price-high", label: copy.productsPage.priceHigh },
                            { value: "rating", label: copy.productsPage.rating }
                          ].map((option) => (
                            <label key={option.value} className="flex items-center py-1">
                              <input
                                type="radio"
                                name="sort"
                                value={option.value}
                                checked={sortBy === option.value}
                                onChange={(event) => setSortBy(event.target.value)}
                                className="text-primary focus:ring-ring mr-3 h-4 w-4 rtl:mr-0 rtl:ml-3"
                              />
                              <span className="text-sm text-gray-600">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-3 text-sm font-medium tracking-wider text-gray-700 uppercase">
                          {copy.productsPage.category}
                        </h3>
                        <div className="space-y-3">
                          {categoryOptions.map((category) => (
                            <label key={category.value} className="flex items-center py-1">
                              <input
                                type="radio"
                                name="category-sheet"
                                value={category.value}
                                checked={selectedCategory === category.value}
                                onChange={(event) => setSelectedCategory(event.target.value)}
                                className="text-primary focus:ring-ring mr-3 h-4 w-4 rtl:mr-0 rtl:ml-3"
                              />
                              <span className="text-sm text-gray-600">{category.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {renderFacet({
                        labels: attributeCopy.shapes,
                        onToggle: (value) =>
                          setSelectedShapes((current) => toggleValue(current, value)),
                        selected: selectedShapes,
                        title: attributeCopy.frameShape,
                        values: availableShapes
                      })}

                      {renderFacet({
                        labels: attributeCopy.genders,
                        onToggle: (value) =>
                          setSelectedGenders((current) => toggleValue(current, value)),
                        selected: selectedGenders,
                        title: attributeCopy.gender,
                        values: availableGenders
                      })}

                      {renderFacet({
                        labels: attributeCopy.colors,
                        onToggle: (value) =>
                          setSelectedColors((current) => toggleValue(current, value)),
                        selected: selectedColors,
                        title: attributeCopy.frameColor,
                        values: availableColors
                      })}

                      <div>
                        <h3 className="mb-3 text-sm font-medium tracking-wider text-gray-700 uppercase">
                          {copy.productsPage.priceRange}
                        </h3>
                        <div className="space-y-3">
                          {[
                            { value: "all", label: copy.productsPage.allPrices },
                            { value: "under-3000", label: copy.productsPage.under3000 },
                            { value: "3000-6000", label: copy.productsPage.range3000to6000 },
                            { value: "6000-10000", label: copy.productsPage.range6000to10000 },
                            { value: "over-10000", label: copy.productsPage.over10000 }
                          ].map((option) => (
                            <label key={option.value} className="flex items-center py-1">
                              <input
                                type="radio"
                                name="price-sheet"
                                value={option.value}
                                checked={priceRange === option.value}
                                onChange={(event) => setPriceRange(event.target.value)}
                                className="text-primary focus:ring-ring mr-3 h-4 w-4 rtl:mr-0 rtl:ml-3"
                              />
                              <span className="text-sm text-gray-600">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-gray-500">{copy.productsPage.emptyState}</p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-4" onClick={resetFilters}>
                    {attributeCopy.reset}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
