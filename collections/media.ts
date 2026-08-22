import path from "node:path";
import type { CollectionConfig } from "payload";
import { isAdmin } from "./access";
import { cleanupMediaReferences } from "./hooks/cleanupMediaReferences";

const MEDIA_DIR = path.resolve(process.cwd(), "media");

export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    plural: { en: "Media", fr: "Médias" },
    singular: { en: "Media file", fr: "Fichier média" },
  },
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
      label: { en: "Alt text", fr: "Texte alternatif" },
    },
  ],
};

