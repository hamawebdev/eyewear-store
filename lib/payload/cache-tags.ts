/**
 * Cache tags shared by the storefront's `unstable_cache` reads and the Payload
 * collection hooks that invalidate them.
 *
 * The storefront routes are prerendered with a long `revalidate` window, so an
 * admin edit only shows up promptly because the collection hooks call
 * `revalidateTag` with these. Keep this module free of `payload` and `next/*`
 * imports so both sides can use it.
 */
export const CACHE_TAGS = {
  categories: "storefront-categories",
  products: "storefront-products",
  reviews: "storefront-product-reviews"
} as const;

/** Tag for a single product's approved reviews. */
export const productReviewsTag = (productId: number | string) =>
  `${CACHE_TAGS.reviews}-${productId}`;
