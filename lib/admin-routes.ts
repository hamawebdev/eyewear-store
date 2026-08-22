/** Payload admin lives under this prefix (`routes.admin` in payload.config.ts). */
export const ADMIN_ROUTE_PREFIX = "/admin";

/**
 * The root layout renders one <html> for both the storefront and the admin, so it
 * has to know which one it is serving. Server layouts cannot read the pathname, so
 * the middleware forwards it on this request header.
 *
 * Kept free of Payload imports so the Edge middleware bundle stays small.
 */
export const PATHNAME_HEADER = "x-pathname";

export const isAdminPathname = (pathname: null | string): boolean =>
  pathname === ADMIN_ROUTE_PREFIX || Boolean(pathname?.startsWith(`${ADMIN_ROUTE_PREFIX}/`));
