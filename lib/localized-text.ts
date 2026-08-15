import { z } from "zod";

export const LocalizedTextSchema = z.object({
  fr: z.string(),
  ar: z.string(),
  en: z.string()
});

export type LocalizedText = z.infer<typeof LocalizedTextSchema>;
