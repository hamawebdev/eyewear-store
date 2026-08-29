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
    /**
     * Converts every new upload to WebP. Payload re-derives the extension and
     * mime type from the *processed* buffer, so `photo.jpg` is stored as
     * `photo.webp` with `mimeType: image/webp` — existing rows keep their own
     * filenames and are not touched.
     *
     * This does not change what visitors download: next/image already re-encodes
     * everything to AVIF/WebP at request time. What it saves is disk in the
     * `eyewear-web-media` volume, backup size, and the CPU spent decoding a large
     * JPEG on every optimizer cache miss — which matters on a shared host.
     *
     * Measured on the current production JPEGs: 1.72 MB -> 0.43 MB at q80.
     *
     * SVGs are exempt automatically: Payload's `canResizeImage()` excludes
     * image/svg+xml, so they pass through byte-for-byte instead of being
     * rasterised.
     */
    formatOptions: {
      format: "webp",
      options: { quality: 80 },
    },
    /**
     * Caps the stored original. `fit: "inside"` preserves aspect ratio and
     * `withoutEnlargement` leaves anything already smaller untouched, so this
     * only ever acts on oversized uploads (a phone camera shot, say). 2400px
     * stays above the largest width next/image is asked for on this site.
     */
    resizeOptions: {
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    },
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

