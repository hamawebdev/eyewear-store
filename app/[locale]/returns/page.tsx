import { getStorefrontCopy } from "@/lib/storefront-copy";
import { getStorefrontDirection } from "@/lib/storefront-language";
import { getServerStorefrontLanguage } from "@/lib/storefront-language.server";
import type { Metadata } from "next";
import { buildLocalizedMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getServerStorefrontLanguage();
  const copy = getStorefrontCopy(language);

  return buildLocalizedMetadata({
    description: copy.returns.intro,
    language,
    path: "/returns",
    title: copy.returns.title
  });
}


export default async function ReturnsPage() {
  const language = await getServerStorefrontLanguage();
  const copy = getStorefrontCopy(language);

  return (
    <div
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"
      dir={getStorefrontDirection(language)}
    >
      <div className="prose prose-gray max-w-none">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">{copy.returns.title}</h1>
        <p className="text-muted-foreground mb-8 text-lg">{copy.returns.intro}</p>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {copy.returns.overview.title}
          </h2>
          <div className="bg-primary/10 border-primary/20 rounded-lg border p-6">
            <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-3">
              {copy.returns.overview.cards.map((card) => (
                <div key={card.title}>
                  <div className="text-primary mb-2 text-3xl font-bold">{card.value}</div>
                  <div className="text-muted-foreground text-sm">{card.title}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {copy.returns.whatCanBeReturned.title}
          </h2>
          <div className="grid grid-cols-1 gap-6 text-gray-700 md:grid-cols-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="mb-3 text-lg font-semibold text-green-800">✓</h3>
              <ul className="space-y-2 text-green-700">
                {copy.returns.whatCanBeReturned.returnable.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="mb-3 text-lg font-semibold text-red-800">✗</h3>
              <ul className="space-y-2 text-red-700">
                {copy.returns.whatCanBeReturned.nonReturnable.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {copy.returns.process.title}
          </h2>
          <div className="grid grid-cols-1 gap-4 text-gray-700 md:grid-cols-4">
            {copy.returns.process.steps.map((step, index) => (
              <div key={step.title} className="text-center">
                <div className="bg-primary mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="mb-2 font-semibold">{step.title}</h3>
                <p className="text-sm">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {copy.returns.table.title}
          </h2>
          <div className="overflow-x-auto text-gray-700">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {copy.returns.table.headers.map((header) => (
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
                {copy.returns.table.rows.map((row) => (
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
            {copy.returns.exchange.title}
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>{copy.returns.exchange.body}</p>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-blue-700">{copy.returns.exchange.highlight}</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {copy.returns.international.title}
          </h2>
          <ul className="list-disc space-y-2 pl-6 text-gray-700 rtl:pr-6 rtl:pl-0">
            {copy.returns.international.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {copy.returns.damagedItems.title}
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>{copy.returns.damagedItems.body}</p>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-yellow-800">{copy.returns.damagedItems.highlight}</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {copy.returns.help.title}
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>{copy.returns.help.body}</p>
            <div className="rounded-lg bg-gray-50 p-6">
              {copy.returns.help.contact.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
