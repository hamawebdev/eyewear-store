import path from "node:path";
import type { CollectionConfig } from "payload";
import { isAdmin } from "./access";
import { cleanupMediaReferences } from "./hooks/cleanupMediaReferences";

const MEDIA_DIR = path.resolve(process.cwd(), "media");

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "filename",
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true,
    update: isAdmin,
  },
  upload: {
    displayPreview: true,
    mimeTypes: ["image/*"],
    staticDir: MEDIA_DIR,
  },
  hooks: {
    beforeDelete: [cleanupMediaReferences],
  },
  fields: [
    {
      name: "alt",
      type: "text",
    },
  ],
};

