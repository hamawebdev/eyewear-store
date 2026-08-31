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
    // Uploads arrive as 3000x2000 originals. Without derivatives every
    // storefront image made `/_next/image` decode that full-size source and
    // re-encode it on demand, and lib/storefront-image.server.ts ran `sharp`
    // over it again just to build a blur placeholder — the dominant cost in a
    // category grid finishing its images. These are generated once at upload.
    //
    // Height is deliberately omitted so aspect ratio is preserved and no crop
    // (and so no focal point) is involved. `withoutEnlargement` keeps a small
    // upload from being scaled up into a file larger than the original.
    //
    // Adding a size here needs a migration (see migrations/) and a re-run of
    // `npm run media:backfill` for the existing rows.
    imageSizes: [
      {
        name: "thumbnail",
        width: 256,
        withoutEnlargement: true,
        formatOptions: { format: "webp", options: { quality: 70 } },
      },
      {
        name: "card",
        width: 800,
        withoutEnlargement: true,
        formatOptions: { format: "webp", options: { quality: 78 } },
      },
      {
        name: "detail",
        width: 1600,
        withoutEnlargement: true,
        formatOptions: { format: "webp", options: { quality: 80 } },
      },
    ],
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

