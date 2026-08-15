import type { CollectionConfig } from "payload";
import { isAdmin, ADMIN_COLLECTION_SLUG } from "./access";

export const Admins: CollectionConfig = {
  slug: ADMIN_COLLECTION_SLUG,
  admin: {
    useAsTitle: "email",
  },
  auth: {
    verify: false,
  },
  access: {
    admin: isAdmin,
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
};
