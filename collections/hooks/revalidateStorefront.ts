import { revalidatePath, revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  PayloadRequest
} from "payload";
import { CACHE_TAGS, productReviewsTag } from "@/lib/payload/cache-tags";

/**
 * The storefront routes are prerendered with a long `revalidate` window, so an
 * admin edit would otherwise sit invisible for an hour. These hooks expire the
 * matching caches as soon as Payload writes, and the next request re-renders.
 *
 * Both halves are needed:
 *
 * - `revalidateTag` drops the `unstable_cache` reads in lib/payload/*. Without
 *   it a re-rendered page would just be handed the same stale catalogue.
 * - `revalidatePath` drops the prerendered pages. Tags used inside
 *   `unstable_cache` during a prerender do not end up on the page's own tag set
 *   (its manifest entry carries no `x-next-cache-tags`), so the tag alone would
 *   never expire the cached HTML.
 *
 * Neither is available outside a Next request context — Payload seeds,
 * migrations and the scripts in scripts/ all write through the Local API — and
 * they throw there rather than no-op, so every call is guarded. A failure here
 * must never take down the write itself.
 */
const STOREFRONT_PAGES = ["/[locale]", "/[locale]/products", "/[locale]/products/[id]"] as const;

const safeRevalidate = (req: PayloadRequest, tags: string[]) => {
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch (error) {
      req.payload.logger.warn(
        `Could not revalidate the "${tag}" cache tag: ${(error as Error).message}`
      );
    }
  }

  for (const page of STOREFRONT_PAGES) {
    try {
      // "page" expands the dynamic segments, so this covers all three locales
      // and every product slug in one call.
      revalidatePath(page, "page");
    } catch (error) {
      req.payload.logger.warn(
        `Could not revalidate the "${page}" route: ${(error as Error).message}`
      );
    }
  }
};

/**
 * A product change can move it between categories and changes the featured
 * ordering, so it invalidates the whole catalogue rather than one entry.
 */
export const revalidateProducts: CollectionAfterChangeHook & CollectionAfterDeleteHook = ({
  req
}) => {
  safeRevalidate(req, [CACHE_TAGS.products]);
};

/**
 * Category names and images are denormalised into every product card, so a
 * category edit has to expire the product reads too.
 */
export const revalidateCategories: CollectionAfterChangeHook & CollectionAfterDeleteHook = ({
  req
}) => {
  safeRevalidate(req, [CACHE_TAGS.categories, CACHE_TAGS.products]);
};

const getReviewProductId = (doc: unknown): null | string => {
  const product = (doc as { product?: unknown } | null)?.product;

  if (typeof product === "number" || typeof product === "string") {
    return String(product);
  }

  if (product && typeof product === "object" && "id" in product) {
    return String((product as { id: number | string }).id);
  }

  return null;
};

/**
 * Approving a review also updates the parent product's rating/count via
 * `syncProductReviewSummary`, so the product reads are expired as well.
 */
export const revalidateProductReviews: CollectionAfterChangeHook &
  CollectionAfterDeleteHook = ({ doc, req }) => {
  const productId = getReviewProductId(doc);

  safeRevalidate(req, [
    CACHE_TAGS.products,
    ...(productId ? [productReviewsTag(productId)] : [CACHE_TAGS.reviews])
  ]);
};
