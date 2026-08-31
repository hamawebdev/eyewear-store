import type React from "react";
import type { Metadata } from "next";
import "../globals.css";

/**
 * Root layout for the Payload admin.
 *
 * The storefront and the admin used to share one root layout, which had to call
 * `headers()` to tell them apart — and that single dynamic read opted every
 * storefront route out of static rendering. They are separate root layouts now,
 * so neither needs to know about the other and the storefront can be prerendered.
 *
 * The admin is French/English only, so it is always LTR. `app/[locale]/layout.tsx`
 * owns the storefront's `<html lang>`/`dir`, taken from the URL segment.
 *
 * `globals.css` is imported here too: the custom login view
 * (components/payload/AdminLoginForm.tsx) renders shadcn `Button`/`Input`, which
 * need the Tailwind layers. The `@layer payload-default, payload` declaration at
 * the top of that file keeps Payload's own styles winning inside the admin.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function PayloadRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
