/**
 * Category links are query filters on the products page rather than dedicated
 * routes, so every entry point (nav, spotlight, category grid) builds them here.
 *
 * The slug must match the category slug stored in Payload, which is seeded from
 * `categories/catalog.json`.
 */
export const getCategoryHref = (slug: string) => `/products?category=${slug}`;
