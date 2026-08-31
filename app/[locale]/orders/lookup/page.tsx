import { normalizeStorefrontLanguage } from "@/lib/storefront-language";
import { Suspense } from "react";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import OrderLookupClient from "./order-lookup-client";

const LookupFallback = ({ loadingLabel }: { loadingLabel: string }) => (
  <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
      <p className="text-sm text-stone-600">{loadingLabel}</p>
    </div>
  </div>
);

export default async function OrderLookupPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const language = normalizeStorefrontLanguage(locale);
  const copy = getStorefrontCopy(language);

  return (
    <Suspense fallback={<LookupFallback loadingLabel={copy.orderLookup.lookupFallback} />}>
      <OrderLookupClient />
    </Suspense>
  );
}
