import { z } from "zod";

export const PLACEHOLDER_IMAGE_SRC = "/placeholder.svg";
export const PLACEHOLDER_IMAGE_ALT = "Placeholder image";
export const PLACEHOLDER_IMAGE_WIDTH = 1200;
export const PLACEHOLDER_IMAGE_HEIGHT = 1200;
export const PLACEHOLDER_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgc3R5bGU9ImJhY2tncm91bmQ6I0Y0RjZGODsiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjRGNkY4Ii8+PHJlY3QgeD0iNiIgeT0iNiIgd2lkdGg9IjM2IiBoZWlnaHQ9IjM2IiByeD0iNCIgZmlsbD0iI0UzRTdFQSIvPjxjaXJjbGUgY3g9IjE5IiBjeT0iMTYiIHI9IjQiIGZpbGw9IiNCOUM0Q0MiLz48cGF0aCBkPSJNMTQgMzRMMjAgMjhDMjAuOTM4MyAyNy4wNjE3IDIyLjQ2MTcgMjcuMDYxNyAyMy40IDI4TDI3LjUgMzIuMUMyOC40IDI5LjkxNjcgMjkuODMzMyAyOS45IDMwLjkgMzEuMkwzNCAyOEw0MiAzNlYzOUgxNFYzNFoiIGZpbGw9IiM5QUE4QjIiLz48L3N2Zz4=";

export const StorefrontImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurDataURL: z.string().optional()
});

export type StorefrontImage = z.infer<typeof StorefrontImageSchema>;

export const DEFAULT_PLACEHOLDER_IMAGE: StorefrontImage = {
  src: PLACEHOLDER_IMAGE_SRC,
  alt: PLACEHOLDER_IMAGE_ALT,
  width: PLACEHOLDER_IMAGE_WIDTH,
  height: PLACEHOLDER_IMAGE_HEIGHT,
  blurDataURL: PLACEHOLDER_BLUR_DATA_URL
};

export const getStorefrontImagePlaceholderProps = (
  image?: Pick<StorefrontImage, "blurDataURL"> | null
) => {
  if (image?.blurDataURL) {
    return {
      blurDataURL: image.blurDataURL,
      placeholder: "blur" as const
    };
  }

  return {};
};

export const isStorefrontPlaceholderImage = (
  image?: Pick<StorefrontImage, "src"> | null
) => image?.src === PLACEHOLDER_IMAGE_SRC;

export const isStoredStorefrontImage = (
  image?: StorefrontImage | null
): image is StorefrontImage => Boolean(image && !isStorefrontPlaceholderImage(image));

export const shouldSkipImageOptimization = (src: string) =>
  src.startsWith("data:") || src.endsWith(".svg") || src.includes(".svg?");
