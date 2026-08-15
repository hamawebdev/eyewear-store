export const FRAME_SHAPES = [
  "round",
  "square",
  "rectangle",
  "aviator",
  "cat-eye",
  "oval",
  "hexagonal",
  "wayfarer"
] as const;

export const GENDERS = ["men", "women", "unisex", "kids"] as const;

export const FRAME_COLORS = [
  "black",
  "tortoise",
  "gold",
  "silver",
  "brown",
  "blue",
  "transparent",
  "rose-gold"
] as const;

export type FrameShape = (typeof FRAME_SHAPES)[number];
export type Gender = (typeof GENDERS)[number];
export type FrameColor = (typeof FRAME_COLORS)[number];

const toAdminLabel = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const toSelectOptions = (values: readonly string[]) =>
  values.map((value) => ({
    label: toAdminLabel(value),
    value
  }));

export const isFrameShape = (value: unknown): value is FrameShape =>
  typeof value === "string" && FRAME_SHAPES.includes(value as FrameShape);

export const isGender = (value: unknown): value is Gender =>
  typeof value === "string" && GENDERS.includes(value as Gender);

export const isFrameColor = (value: unknown): value is FrameColor =>
  typeof value === "string" && FRAME_COLORS.includes(value as FrameColor);
