import { unstable_noStore as noStore } from "next/cache";
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

export const getApprovedProductReviews = async (productId: string) => {
  noStore();

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
};
