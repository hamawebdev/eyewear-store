import { getStorefrontCopy } from "@/lib/storefront-copy";
import {
  getStorefrontDirection,
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
    description: copy.shipping.intro,
    language,
    path: "/shipping",
    title: copy.shipping.title
  });
}


export default async function ShippingPage({
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
        <h1 className="mb-8 text-4xl font-bold text-gray-900">{copy.shipping.title}</h1>
        <p className="text-muted-foreground mb-8 text-lg">{copy.shipping.intro}</p>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {copy.shipping.options.title}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-gray-700">
              <thead className="bg-gray-50">
                <tr>
                  {copy.shipping.options.headers.map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase rtl:text-right"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {copy.shipping.options.rows.map((row) => (
                  <tr key={row.join("-")}>
                    {row.map((cell, index) => (
                      <td
                        key={`${row[0]}-${index}`}
                        className={`px-6 py-4 text-sm whitespace-nowrap ${index === 0 ? "font-medium text-gray-900" : "text-gray-500"}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {copy.shipping.freeShipping.title}
          </h2>
          <div className="rounded-lg border border-green-200 bg-green-50 p-6">
            <h3 className="mb-3 text-lg font-semibold text-green-800">
              {"\u{1F69A}"} {copy.shipping.freeShipping.title}
            </h3>
            <p className="mb-4 text-green-700">{copy.shipping.freeShipping.body}</p>
            <ul className="list-disc space-y-2 pl-6 text-green-700 rtl:pr-6 rtl:pl-0">
              {copy.shipping.freeShipping.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {copy.shipping.processing.title}
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>{copy.shipping.processing.intro}</p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {copy.shipping.processing.cards.map((card) => (
                <div key={card.title} className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">{card.title}</h3>
                  <p className="text-muted-foreground">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {copy.shipping.international.title}
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>{copy.shipping.international.body}</p>
            <ul className="list-disc space-y-2 pl-6 rtl:pr-6 rtl:pl-0">
              {copy.shipping.international.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-blue-700">{copy.shipping.international.highlight}</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {copy.shipping.tracking.title}
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>{copy.shipping.tracking.body}</p>
            <ul className="list-disc space-y-2 pl-6 rtl:pr-6 rtl:pl-0">
              {copy.shipping.tracking.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {copy.shipping.deliveryInfo.title}
          </h2>
          <div className="space-y-4 text-gray-700">
            <ul className="list-disc space-y-2 pl-6 rtl:pr-6 rtl:pl-0">
              {copy.shipping.deliveryInfo.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <ul className="space-y-2 text-yellow-800">
                {copy.shipping.deliveryInfo.issues.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {copy.shipping.specialServices.title}
          </h2>
          <div className="grid grid-cols-1 gap-6 text-gray-700 md:grid-cols-2">
            {copy.shipping.specialServices.cards.map((card) => (
              <div key={card.title} className="rounded-lg border border-gray-200 p-6">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">{card.title}</h3>
                <p className="text-muted-foreground mb-3">{card.subtitle}</p>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  {card.body.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {copy.shipping.restrictions.title}
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <ul className="space-y-2 text-red-700">
                {copy.shipping.restrictions.shippingRestrictions.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <ul className="space-y-2 text-orange-700">
                {copy.shipping.restrictions.productRestrictions.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
