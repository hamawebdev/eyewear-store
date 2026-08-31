import "server-only";

import path from "node:path";
import { cache } from "react";
import sharp from "sharp";
import type { PayloadMediaReference, PayloadMediaSize } from "@/lib/payload/types";
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

type MediaFile = Pick<PayloadMediaSize, "filename" | "height" | "url" | "width">;

const getFilenameFromMedia = (media: MediaFile) => {
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

const getLocalMediaFilePath = (media: MediaFile) => {
  const filename = getFilenameFromMedia(media);

  return filename ? path.join(MEDIA_DIR, filename) : null;
};

const hasUrl = (size: null | PayloadMediaSize | undefined): size is MediaFile =>
  Boolean(size && typeof size.url === "string" && size.url.trim());

/**
 * Picks the derivative to hand to `next/image` as the source.
 *
 * The uploads are 3000px wide; the largest slot the storefront renders is the
 * product detail image at ~50vw, so `detail` (1600px) is as much as any layout
 * can use. Serving it instead of the original means the optimizer decodes a file
 * roughly a tenth the size on every cache miss. Falls back down the chain, and
 * finally to the original, so media uploaded before the derivatives existed (or
 * anything the backfill missed) still renders.
 */
const pickDisplaySource = (media: PayloadMediaObject): MediaFile => {
  const sizes = media.sizes;

  if (hasUrl(sizes?.detail)) return sizes.detail;
  if (hasUrl(sizes?.card)) return sizes.card;

  return media;
};

/**
 * The blur placeholder is a 24px webp, so it only ever needs the smallest
 * derivative. Running `sharp` over the 3000px original for this was pure waste.
 */
const pickBlurSource = (media: PayloadMediaObject): MediaFile => {
  const sizes = media.sizes;

  if (hasUrl(sizes?.thumbnail)) return sizes.thumbnail;
  if (hasUrl(sizes?.card)) return sizes.card;

  return media;
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

  const displaySource = pickDisplaySource(media);
  const src =
    typeof displaySource.url === "string" && displaySource.url.trim()
      ? normalizeStorefrontSrc(displaySource.url.trim())
      : null;

  if (!src) {
    return clonePlaceholder(altFallback);
  }

  const absoluteFilePath = getLocalMediaFilePath(displaySource);
  const alt =
    typeof media.alt === "string" && media.alt.trim() ? media.alt.trim() : altFallback;

  // Dimensions must describe the file at `src`, not the original, or next/image
  // reserves the wrong aspect box.
  let width =
    typeof displaySource.width === "number" && displaySource.width > 0
      ? displaySource.width
      : undefined;
  let height =
    typeof displaySource.height === "number" && displaySource.height > 0
      ? displaySource.height
      : undefined;
  let blurDataURL: string | undefined;

  const blurFilePath = getLocalMediaFilePath(pickBlurSource(media));

  if (blurFilePath) {
    try {
      blurDataURL = await getBlurDataURL(blurFilePath);
    } catch {
      blurDataURL = DEFAULT_PLACEHOLDER_IMAGE.blurDataURL;
    }
  }

  if ((!width || !height) && absoluteFilePath) {
    try {
      const metadata = await getLocalImageMetadata(absoluteFilePath);
      width ??= metadata.width;
      height ??= metadata.height;
    } catch {
      // Falls through to the placeholder dimensions below.
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
