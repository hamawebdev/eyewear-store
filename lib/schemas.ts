import { z } from "zod";
export {
  CartItemSchema,
  CheckoutSchema,
  type CartItem,
  type CheckoutForm
} from "@/lib/orders/schemas";
export { StorefrontImageSchema, type StorefrontImage } from "@/lib/storefront-image";
import { StorefrontImageSchema } from "@/lib/storefront-image";
import { LocalizedTextSchema, type LocalizedText } from "@/lib/localized-text";
import { FRAME_COLORS, FRAME_SHAPES, GENDERS } from "@/lib/eyewear";

export { LocalizedTextSchema, type LocalizedText } from "@/lib/localized-text";

export const ProductOptionSchema = z.object({
  id: z.string(),
  isDefault: z.boolean().optional(),
  label: LocalizedTextSchema,
  price: z.number().positive(),
  originalPrice: z.number().positive().optional()
});

export const ProductCategoryRefSchema = z.object({
  id: z.string(),
  name: LocalizedTextSchema,
  slug: z.string()
});

export const CategorySchema = z.object({
  id: z.string(),
  name: LocalizedTextSchema,
  slug: z.string(),
  image: StorefrontImageSchema,
  backgroundImage: StorefrontImageSchema,
  description: LocalizedTextSchema,
  headline: LocalizedTextSchema,
  outlinedPill: LocalizedTextSchema,
  sortOrder: z.number().int()
});

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  featuredRank: z.number().int().positive().optional(),
  name: LocalizedTextSchema,
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  image: StorefrontImageSchema,
  artboardImage: StorefrontImageSchema.optional(),
  rating: z.number().min(0).max(5),
  reviews: z.number().min(0),
  category: ProductCategoryRefSchema,
  badge: LocalizedTextSchema.optional(),
  description: LocalizedTextSchema.optional(),
  images: z.array(StorefrontImageSchema).optional(),
  options: z.array(ProductOptionSchema).optional(),
  features: z.array(LocalizedTextSchema).optional(),
  frameShape: z.enum(FRAME_SHAPES).optional(),
  gender: z.enum(GENDERS).optional(),
  frameColor: z.enum(FRAME_COLORS).optional()
});

export const ProductReviewSchema = z.object({
  id: z.string(),
  authorName: z.string(),
  rating: z.number().min(1).max(5),
  content: z.string(),
  submittedAt: z.string()
});

export const ProductReviewSubmissionSchema = z.object({
  authorName: z.string().trim().min(2, "Name must be at least 2 characters"),
  rating: z.number().int().min(1, "Rating is required").max(5),
  content: z.string().trim().min(10, "Review must be at least 10 characters")
});

// Contact form schema
export const ContactSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone number is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

// Infer types from schemas
export type ProductOption = z.infer<typeof ProductOptionSchema>;
export type ProductCategoryRef = z.infer<typeof ProductCategoryRefSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ProductReview = z.infer<typeof ProductReviewSchema>;
export type ProductReviewSubmission = z.infer<typeof ProductReviewSubmissionSchema>;
export type ContactForm = z.infer<typeof ContactSchema>;
