import { unstable_cache } from "next/cache";
import { CACHE_TAGS, productReviewsTag } from "@/lib/payload/cache-tags";
import { normalizeDocumentId } from "@/lib/document-id";
import { getPayloadClient } from "@/lib/payload/server";
import type { PayloadProductReviewDocument } from "@/lib/payload/types";
import { ProductReviewSchema, type ProductReview } from "@/lib/schemas";

const mapProductReviewDocument = (doc: PayloadProductReviewDocument): ProductReview =>
  ProductReviewSchema.parse({
    id: String(doc.id),
    authorName: doc.authorName,
    rating: doc.rating,
    content: doc.content,
    submittedAt: doc.submittedAt ?? doc.createdAt,
  });

/**
 * Cached rather than `noStore()`.
 *
 * The product page is prerendered now, and an uncached read here would opt the
 * whole route back into dynamic rendering. Approving or deleting a review
 * invalidates this through the hooks in collections/product-reviews.ts, so the
 * storefront still updates immediately.
 */
export const getApprovedProductReviews = async (productId: string) =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient();
      const result = await payload.find({
        collection: "product-reviews",
        depth: 0,
        overrideAccess: false,
        pagination: false,
        sort: "-submittedAt",
        where: {
          product: {
            equals: normalizeDocumentId(productId),
          },
        },
      });

      return (result.docs as PayloadProductReviewDocument[]).map(mapProductReviewDocument);
    },
    [`product-reviews-${productId}`],
    { revalidate: 3600, tags: [CACHE_TAGS.reviews, productReviewsTag(productId)] }
  )();
