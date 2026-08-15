import type { Payload } from "payload";

export type WilayaLookupDoc = {
  code?: null | string;
  homeDeliveryPrice?: null | number;
  id?: number | string;
  name?: null | string;
  nameAr?: null | string;
  nameEn?: null | string;
  officeDeliveryPrice?: null | number;
};

/**
 * Finds a wilaya by any of its localized names (French `name`, Arabic `nameAr`,
 * or English `nameEn`). The storefront dropdown submits whichever localized name
 * matches the active language, so the lookup must accept all three.
 */
export const findWilayaByLocalizedName = async ({
  name,
  payload
}: {
  name: string;
  payload: Payload;
}): Promise<undefined | WilayaLookupDoc> => {
  const trimmed = name.trim();

  if (!trimmed) {
    return undefined;
  }

  const result = await payload.find({
    collection: "wilayas",
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      or: [
        { name: { equals: trimmed } },
        { nameAr: { equals: trimmed } },
        { nameEn: { equals: trimmed } }
      ]
    }
  });

  return result.docs[0] as undefined | WilayaLookupDoc;
};
