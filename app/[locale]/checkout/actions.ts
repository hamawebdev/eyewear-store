"use server";

import { getPayloadClient } from "@/lib/payload/server";
import { buildLocalizedText, resolveLocalizedText } from "@/lib/storefront-language";
import { getServerStorefrontLanguage } from "@/lib/storefront-language.server";

export async function getWilayas() {
  const payload = await getPayloadClient();
  const language = await getServerStorefrontLanguage();

  const result = await payload.find({
    collection: "wilayas",
    limit: 60,
    pagination: false,
    sort: "code"
  });

  return result.docs.map((doc) => {
    const localizedName = buildLocalizedText({
      ar: (doc as { nameAr?: string }).nameAr ?? doc.name,
      fr: doc.name,
      en: (doc as { nameEn?: string }).nameEn ?? doc.name
    });

    return {
      id: doc.id,
      code: doc.code,
      name: resolveLocalizedText(localizedName, language),
      homeDeliveryPrice: doc.homeDeliveryPrice,
      officeDeliveryPrice: doc.officeDeliveryPrice
    };
  });
}
