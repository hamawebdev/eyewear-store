import { getStorefrontCopy } from "@/lib/storefront-copy";
import {
  getStorefrontDirection,
  getStorefrontLocale,
  normalizeStorefrontLanguage
} from "@/lib/storefront-language";
import type { Metadata } from "next";
import { buildLocalizedMetadata } from "@/lib/seo";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const language = normalizeStorefrontLanguage(locale);
  const copy = getStorefrontCopy(language);

  return buildLocalizedMetadata({
    description: undefined,
    language,
    path: "/terms",
    title: copy.terms.title
  });
}


export default async function TermsOfServicePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const language = normalizeStorefrontLanguage(locale);
  const copy = getStorefrontCopy(language);

  return (
    <div
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"
      dir={getStorefrontDirection(language)}
    >
      <div className="prose prose-gray max-w-none">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">{copy.terms.title}</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          {copy.terms.introDatePrefix}:{" "}
          {new Date().toLocaleDateString(getStorefrontLocale(language))}
        </p>

        {copy.terms.sections.map((section) => (
          <section key={section.title} className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">{section.title}</h2>
            <div className="space-y-4 text-gray-700">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {"bullets" in section && section.bullets ? (
                <ul className="list-disc space-y-2 pl-6 rtl:pr-6 rtl:pl-0">
                  {(section.bullets as readonly string[]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
