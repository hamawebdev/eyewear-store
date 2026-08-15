import type { PayloadRequest } from "payload";

export const ADMIN_COLLECTION_SLUG = "admins";

export const isAdmin = ({ req }: { req: PayloadRequest }) =>
  Boolean(req.user?.collection === ADMIN_COLLECTION_SLUG);
