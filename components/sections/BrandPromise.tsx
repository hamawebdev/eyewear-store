import { getStorefrontCopy } from "@/lib/storefront-copy";
import { getServerStorefrontLanguage } from "@/lib/storefront-language.server";

export default async function BrandPromise() {
  const language = await getServerStorefrontLanguage();
  const copy = getStorefrontCopy(language);

  return (
    <section className="bg-background relative overflow-hidden py-16 sm:py-20 lg:py-24">
      <div className="relative mx-auto max-w-6xl px-6 sm:px-10 lg:px-14">
        <p className="text-foreground mx-auto max-w-4xl text-center font-serif text-3xl leading-[1.2] font-black sm:text-4xl lg:text-[3.5rem]">
          {copy.brandPromise.text}
        </p>
      </div>
    </section>
  );
}
