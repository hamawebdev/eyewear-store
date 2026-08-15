import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  PayloadRequest,
} from "payload";
import { isAdmin } from "./access";

type ProductRelationship =
  | {
      id: number | string;
    }
  | number
  | string
  | null
  | undefined;

type ProductReviewDocument = {
  authorName?: string;
  content?: string;
  id: number | string;
  product?: ProductRelationship;
  rating?: number;
  status?: "approved" | "pending" | "rejected";
  submittedAt?: null | string;
};

const DERIVED_REVIEW_SUMMARY_CONTEXT_KEY = "syncDerivedReviewSummary";

const getProductID = (value: ProductRelationship) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value.id;
  }

  return value;
};

const syncProductReviewSummary = async (req: PayloadRequest, productID: number | string) => {
  const result = await req.payload.find({
    collection: "product-reviews",
    depth: 0,
    limit: 0,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          product: {
            equals: productID,
          },
        },
        {
          status: {
            equals: "approved",
          },
        },
      ],
    },
  });

  const approvedReviews = result.docs as ProductReviewDocument[];
  const reviewCount = approvedReviews.length;
  const averageRating =
    reviewCount > 0
      ? Number(
          (
            approvedReviews.reduce((total, review) => total + (review.rating ?? 0), 0) / reviewCount
          ).toFixed(1),
        )
      : 0;

  await req.payload.update({
    collection: "products",
    context: {
      ...req.context,
      [DERIVED_REVIEW_SUMMARY_CONTEXT_KEY]: true,
    },
    data: {
      rating: averageRating,
      reviews: reviewCount,
    },
    id: productID,
    overrideAccess: true,
    req,
  });
};

const syncAffectedProductReviewSummaries = async (
  req: PayloadRequest,
  productRelationships: ProductRelationship[],
) => {
  const productIDs = [...new Set(productRelationships.map(getProductID).filter(Boolean))] as Array<
    number | string
  >;

  for (const productID of productIDs) {
    await syncProductReviewSummary(req, productID);
  }
};

const enforceReviewDefaults: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  const nextData = { ...(data ?? {}) } as ProductReviewDocument;

  if (!nextData.submittedAt) {
    nextData.submittedAt = originalDoc?.submittedAt ?? new Date().toISOString();
  }

  if (!isAdmin({ req })) {
    nextData.status = "pending";
    return nextData;
  }

  if (!nextData.status) {
    nextData.status = originalDoc?.status ?? "pending";
  }

  return nextData;
};

const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  await syncAffectedProductReviewSummaries(req, [
    (previousDoc as ProductReviewDocument | undefined)?.product,
    (doc as ProductReviewDocument).product,
  ]);

  return doc;
};

const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await syncAffectedProductReviewSummaries(req, [(doc as ProductReviewDocument).product]);

  return doc;
};

export const ProductReviews: CollectionConfig = {
  slug: "product-reviews",
  admin: {
    defaultColumns: ["authorName", "product", "status", "rating", "submittedAt", "updatedAt"],
    useAsTitle: "authorName",
  },
  defaultSort: "-submittedAt",
  access: {
    create: () => true,
    delete: isAdmin,
    read: ({ req }) =>
      isAdmin({ req })
        ? true
        : {
            status: {
              equals: "approved",
            },
          },
    update: isAdmin,
  },
  hooks: {
    afterChange: [afterChange],
    afterDelete: [afterDelete],
    beforeValidate: [enforceReviewDefaults],
  },
  labels: {
    plural: "Product Reviews",
    singular: "Product Review",
  },
  fields: [
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      required: true,
    },
    {
      name: "authorName",
      type: "text",
      required: true,
    },
    {
      name: "rating",
      type: "number",
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: "content",
      type: "textarea",
      required: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "status",
          type: "select",
          defaultValue: "pending",
          required: true,
          options: [
            {
              label: "Pending",
              value: "pending",
            },
            {
              label: "Approved",
              value: "approved",
            },
            {
              label: "Rejected",
              value: "rejected",
            },
          ],
          admin: {
            width: "50%",
          },
        },
        {
          name: "submittedAt",
          type: "date",
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: {
            readOnly: true,
            width: "50%",
          },
        },
      ],
    },
  ],
};
