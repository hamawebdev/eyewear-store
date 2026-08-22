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

// French names for the admin select fields. The English side stays derived from the
// value itself, which is what these selects showed before they were translated.
export const FRAME_SHAPE_LABELS_FR: Record<FrameShape, string> = {
  aviator: "Aviateur",
  "cat-eye": "Œil-de-chat",
  hexagonal: "Hexagonale",
  oval: "Ovale",
  rectangle: "Rectangulaire",
  round: "Ronde",
  square: "Carrée",
  wayfarer: "Wayfarer"
};

export const GENDER_LABELS_FR: Record<Gender, string> = {
  kids: "Enfant",
  men: "Homme",
  unisex: "Mixte",
  women: "Femme"
};

export const FRAME_COLOR_LABELS_FR: Record<FrameColor, string> = {
  black: "Noir",
  blue: "Bleu",
  brown: "Marron",
  gold: "Doré",
  "rose-gold": "Or rose",
  silver: "Argenté",
  tortoise: "Écaille",
  transparent: "Transparent"
};

export const toSelectOptions = (
  values: readonly string[],
  frenchLabels: Record<string, string>
) =>
  values.map((value) => ({
    label: {
      en: toAdminLabel(value),
      fr: frenchLabels[value] ?? toAdminLabel(value)
    },
    value
  }));

export const isFrameShape = (value: unknown): value is FrameShape =>
  typeof value === "string" && FRAME_SHAPES.includes(value as FrameShape);

export const isGender = (value: unknown): value is Gender =>
  typeof value === "string" && GENDERS.includes(value as Gender);

export const isFrameColor = (value: unknown): value is FrameColor =>
  typeof value === "string" && FRAME_COLORS.includes(value as FrameColor);
