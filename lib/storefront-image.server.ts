import "server-only";

import path from "node:path";
import { cache } from "react";
import sharp from "sharp";
import type { PayloadMediaReference } from "@/lib/payload/types";
import {
  DEFAULT_PLACEHOLDER_IMAGE,
  StorefrontImageSchema,
  type StorefrontImage
} from "@/lib/storefront-image";

const MEDIA_DIR = path.resolve(process.cwd(), "media");

type PayloadMediaObject = Extract<PayloadMediaReference, Record<string, unknown>>;

const isPayloadMediaObject = (value: PayloadMediaReference): value is PayloadMediaObject =>
  typeof value === "object" && value !== null;

const normalizeStorefrontSrc = (value: string) => {
  let normalizedPath = value;

  if (value.startsWith("http://") || value.startsWith("https://")) {
    const url = new URL(value);
    normalizedPath = `${url.pathname}${url.search}`;
  } else {
    normalizedPath = value.startsWith("/") ? value : `/${value}`;
  }

  // Rewrite Payload's API media path to the native Next.js static symlink path
  // This avoids Next.js Image making HTTP loopback requests inside Docker
  if (normalizedPath.startsWith("/api/media/file/")) {
    return normalizedPath.replace("/api/media/file/", "/media/");
  }

  return normalizedPath;
};

const getFilenameFromMedia = (media: PayloadMediaObject) => {
  if (typeof media.filename === "string" && media.filename.trim()) {
    return path.basename(media.filename.trim());
  }

  if (typeof media.url === "string" && media.url.trim()) {
    const normalizedUrl = media.url.startsWith("http")
      ? new URL(media.url).pathname
      : media.url.split("?")[0];

    return path.basename(normalizedUrl);
  }

  return null;
};

const getLocalMediaFilePath = (media: PayloadMediaObject) => {
  const filename = getFilenameFromMedia(media);

  return filename ? path.join(MEDIA_DIR, filename) : null;
};

const getLocalImageMetadata = cache(async (absoluteFilePath: string) => {
  const metadata = await sharp(absoluteFilePath).metadata();

  return {
    height:
      typeof metadata.height === "number" && metadata.height > 0
        ? metadata.height
        : DEFAULT_PLACEHOLDER_IMAGE.height,
    width:
      typeof metadata.width === "number" && metadata.width > 0
        ? metadata.width
        : DEFAULT_PLACEHOLDER_IMAGE.width
  };
});

const getBlurDataURL = cache(async (absoluteFilePath: string) => {
  const buffer = await sharp(absoluteFilePath)
    .resize(24, 24, {
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: 50 })
    .toBuffer();

  return `data:image/webp;base64,${buffer.toString("base64")}`;
});

const createStorefrontImage = ({
  alt,
  blurDataURL,
  height,
  src,
  width
}: {
  alt: string;
  blurDataURL?: string;
  height: number;
  src: string;
  width: number;
}) =>
  StorefrontImageSchema.parse({
    alt,
    blurDataURL,
    height,
    src,
    width
  });

const clonePlaceholder = (alt: string) =>
  StorefrontImageSchema.parse({
    ...DEFAULT_PLACEHOLDER_IMAGE,
    alt
  });

export const getPayloadMediaImage = async (
  media: PayloadMediaReference,
  {
    altFallback
  }: {
    altFallback: string;
  }
): Promise<StorefrontImage> => {
  if (!isPayloadMediaObject(media)) {
    return clonePlaceholder(altFallback);
  }

  const src =
    typeof media.url === "string" && media.url.trim() ? normalizeStorefrontSrc(media.url.trim()) : null;

  if (!src) {
    return clonePlaceholder(altFallback);
  }

  const absoluteFilePath = getLocalMediaFilePath(media);
  const alt =
    typeof media.alt === "string" && media.alt.trim() ? media.alt.trim() : altFallback;

  let width =
    typeof media.width === "number" && media.width > 0 ? media.width : undefined;
  let height =
    typeof media.height === "number" && media.height > 0 ? media.height : undefined;
  let blurDataURL: string | undefined;

  if (absoluteFilePath) {
    try {
      blurDataURL = await getBlurDataURL(absoluteFilePath);

      if (!width || !height) {
        const metadata = await getLocalImageMetadata(absoluteFilePath);
        width ??= metadata.width;
        height ??= metadata.height;
      }
    } catch {
      blurDataURL = DEFAULT_PLACEHOLDER_IMAGE.blurDataURL;
    }
  }

  return createStorefrontImage({
    alt,
    blurDataURL,
    height: height ?? DEFAULT_PLACEHOLDER_IMAGE.height,
    src,
    width: width ?? DEFAULT_PLACEHOLDER_IMAGE.width
  });
};
