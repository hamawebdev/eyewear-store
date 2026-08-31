import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DEFAULT_STOREFRONT_LANGUAGE,
  STOREFRONT_LANGUAGE_COOKIE,
  STOREFRONT_LANGUAGE_VALUES,
  isStorefrontLanguage
} from "@/lib/storefront-language";

const ADMIN_REDIRECT_ROUTES = new Set(["/admin/create-first-user", "/admin/forgot", "/admin/reset"]);
const BLOCKED_API_ROUTES = new Set([
  "/api/admins/first-register",
  "/api/admins/forgot-password",
  "/api/admins/reset-password"
]);

const normalizePath = (pathname: string): string => {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
};

const SKIP_LOCALE_PREFIXES = [
  "/api",
  "/admin",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/fonts",
  "/hero-poster",
  "/placeholder",
  "/logo"
];

const hasFileExtension = (pathname: string) => /\.[a-zA-Z0-9]+$/.test(pathname);

const shouldSkipLocaleRouting = (pathname: string) => {
  if (hasFileExtension(pathname)) return true;
  return SKIP_LOCALE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

const getLocaleFromPathname = (pathname: string): string | null => {
  const firstSegment = pathname.split("/")[1];
  return isStorefrontLanguage(firstSegment) ? firstSegment : null;
};

export function middleware(request: NextRequest) {
  const pathname = normalizePath(request.nextUrl.pathname);

  // Handle admin redirects
  if (ADMIN_REDIRECT_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Block certain API routes
  if (BLOCKED_API_ROUTES.has(pathname)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Skip locale routing for static files, admin, API, etc.
  if (shouldSkipLocaleRouting(pathname)) {
    return NextResponse.next();
  }

  const detectedLocale = getLocaleFromPathname(pathname);

  // If already has a valid locale prefix, sync cookie and pass through. The
  // cookie is only written when it actually changes: the storefront pages are
  // prerendered now, and a Set-Cookie on every single response would stop any
  // proxy in front of the app from reusing them.
  if (detectedLocale) {
    const response = NextResponse.next();

    if (request.cookies.get(STOREFRONT_LANGUAGE_COOKIE)?.value !== detectedLocale) {
      response.cookies.set(STOREFRONT_LANGUAGE_COOKIE, detectedLocale, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax"
      });
    }

    return response;
  }

  // No locale prefix — redirect to default locale
  const cookieLocale = request.cookies.get(STOREFRONT_LANGUAGE_COOKIE)?.value;
  const targetLocale = isStorefrontLanguage(cookieLocale) ? cookieLocale : DEFAULT_STOREFRONT_LANGUAGE;
  const redirectUrl = new URL(`/${targetLocale}${pathname === "/" ? "" : pathname}${request.nextUrl.search}`, request.url);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
