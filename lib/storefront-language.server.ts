import { cookies } from "next/headers";
import {
  STOREFRONT_LANGUAGE_COOKIE,
  normalizeStorefrontLanguage,
  type StorefrontLanguage
} from "@/lib/storefront-language";

export const getServerStorefrontLanguage = async (): Promise<StorefrontLanguage> => {
  const cookieStore = await cookies();

  return normalizeStorefrontLanguage(cookieStore.get(STOREFRONT_LANGUAGE_COOKIE)?.value);
};
