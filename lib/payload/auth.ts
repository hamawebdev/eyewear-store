import { createLocalReq } from "payload";
import type { PayloadRequest } from "payload";
import { getPayloadClient } from "@/lib/payload/server";
import { ADMIN_COLLECTION_SLUG } from "@/collections/access";

export const getAuthenticatedPayloadRequest = async (headers: Headers) => {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({
    canSetHeaders: false,
    headers,
    req: {
      headers,
      host: headers.get("host") || undefined
    } as PayloadRequest
  });
  const req = await createLocalReq(
    {
      req: {
        headers,
        host: headers.get("host") || undefined,
        user: user ?? undefined
      }
    },
    payload
  );

  return {
    payload,
    req,
    user
  };
};

export const requireAdminPayloadRequest = async (headers: Headers) => {
  const context = await getAuthenticatedPayloadRequest(headers);

  if (context.user?.collection !== ADMIN_COLLECTION_SLUG) {
    return null;
  }

  return context;
};
