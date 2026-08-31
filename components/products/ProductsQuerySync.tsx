"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FRAME_COLORS, FRAME_SHAPES, GENDERS } from "@/lib/eyewear";

export type ProductsQueryFilters = {
  category: null | string;
  colors: string[];
  genders: string[];
  shapes: string[];
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

/**
 * Pushes the URL's filter params into `ProductsPageClient`, and renders nothing.
 *
 * This exists purely to isolate `useSearchParams`. `/[locale]/products` is
 * prerendered, and on a prerendered route Next client-renders the whole subtree
 * up to the nearest Suspense boundary around any component that reads search
 * params. Keeping that read in a null-rendering leaf means the boundary contains
 * nothing, so the full product grid still ships in the static HTML — while a
 * category link remains a same-page query change with no network request.
 */
export default function ProductsQuerySync({
  onChange
}: {
  onChange: (filters: ProductsQueryFilters) => void;
}) {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const shape = searchParams.get("shape");
  const gender = searchParams.get("gender");
  const color = searchParams.get("color");

  useEffect(() => {
    onChange({
      category,
      colors: parseFacetParam(color, FRAME_COLORS),
      genders: parseFacetParam(gender, GENDERS),
      shapes: parseFacetParam(shape, FRAME_SHAPES)
    });
  }, [category, color, gender, onChange, shape]);

  return null;
}
