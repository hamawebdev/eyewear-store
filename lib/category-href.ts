/**
 * Category links are query filters on the products page rather than dedicated
 * routes, so every entry point (nav, spotlight, category grid) builds them here.
 *
 * The slug must match the category slug stored in Payload, which is seeded from
 * `categories/catalog.json`.
 *
 * The locale prefix is required. Without it `middleware.ts` answers the click
 * with a 307 to `/<locale>/products?...`, which doubles the round trip and makes
 * the `<Link>` prefetch useless — that was the single biggest cost in going from
 * the homepage to a category. Client components can get the locale from
 * `useStorefrontLanguage()` or `useParams()`; server components take it as a prop.
 */
export const getCategoryHref = (locale: string, slug: string) =>
  `/${locale}/products?category=${slug}`;
