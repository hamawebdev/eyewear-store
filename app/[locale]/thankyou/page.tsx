import { normalizeStorefrontLanguage } from "@/lib/storefront-language";
import { Button } from "@/components/ui/button";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import LocalizedLink from "@/components/localized-link";

export default async function ThankYouPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const language = normalizeStorefrontLanguage(locale);
  const copy = getStorefrontCopy(language);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <p className="text-sm font-semibold tracking-[0.22em] text-amber-700 uppercase">
        {copy.thankYou.eyebrow}
      </p>
      <h1 className="mt-3 text-4xl font-bold text-gray-900">{copy.thankYou.title}</h1>
      <p className="text-muted-foreground mt-4 text-lg">{copy.thankYou.body}</p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
        <LocalizedLink href="/products">
          <Button size="lg" variant="outline" className="bg-transparent">
            {copy.thankYou.continueShopping}
          </Button>
        </LocalizedLink>
      </div>
    </div>
  );
}
