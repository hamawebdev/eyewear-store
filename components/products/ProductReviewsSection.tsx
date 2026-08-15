"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { normalizeDocumentId } from "@/lib/document-id";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import {
  ProductReviewSubmissionSchema,
  type ProductReview,
  type ProductReviewSubmission,
} from "@/lib/schemas";
import {
  getStorefrontLocale,
  resolveLocalizedText
} from "@/lib/storefront-language";
import { useForm } from "@/hooks/useForm";
import { Rating } from "@/components/shadcnblocks/rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  productId: string;
  productName: string | { ar: string; fr: string; en: string };
  reviews: ProductReview[];
};

const getErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as {
      errors?: Array<{ message?: string }>;
      message?: string;
    };

    if (payload.errors?.[0]?.message) {
      return payload.errors[0].message;
    }

    if (payload.message) {
      return payload.message;
    }
  } catch {
    return null;
  }

  return null;
};

export default function ProductReviewsSection({ productId, productName, reviews }: Props) {
  const { language } = useStorefrontLanguage();
  const { data, errors, handleSubmit, isSubmitting, setValue } = useForm(
    ProductReviewSubmissionSchema,
    {
      authorName: "",
      content: "",
      rating: 5,
    },
  );
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const copy = getStorefrontCopy(language);
  const localizedProductName = resolveLocalizedText(productName, language);
  const reviewDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(getStorefrontLocale(language), {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [language],
  );

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }

    return Number(
      (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1),
    );
  }, [reviews]);

  const onSubmit = async (formData: ProductReviewSubmission) => {
    setSubmitError(null);
    setSubmitMessage(null);

    const response = await fetch("/api/product-reviews", {
      body: JSON.stringify({
        authorName: formData.authorName,
        content: formData.content,
        product: normalizeDocumentId(productId),
        rating: formData.rating,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      setSubmitError(
        (await getErrorMessage(response)) ||
          copy.productReviews.submissionError,
      );
      return;
    }

    setValue("authorName", "");
    setValue("content", "");
    setValue("rating", 5);
    setSubmitMessage(copy.productReviews.pendingMessage);
  };

  return (
    <section className="border-border mt-12 border-t pt-12 md:pt-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,420px)]">
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">{copy.productReviews.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <Rating rate={averageRating} className="[&_svg]:size-5" />
              <span>
                {averageRating.toFixed(1)} {copy.productReviews.averageOutOfFive} {reviews.length}{" "}
                {reviews.length === 1
                  ? copy.productReviews.approved
                  : copy.productReviews.approvedPlural}
              </span>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-sm text-gray-600">
              {copy.productReviews.emptyStatePrefix} {localizedProductName}{" "}
              {copy.productReviews.emptyStateSuffix}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900" dir="auto">
                        {review.authorName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {reviewDateFormatter.format(new Date(review.submittedAt))}
                      </p>
                    </div>
                    <Rating rate={review.rating} className="[&_svg]:size-4" />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-gray-700" dir="auto">
                    {review.content}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">
              {copy.productReviews.writeReview}
            </h3>
            <p className="text-sm text-gray-600">
              {copy.productReviews.intro}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="review-author-name">{copy.productReviews.nameLabel}</Label>
              <Input
                id="review-author-name"
                value={data.authorName ?? ""}
                onChange={(event) => setValue("authorName", event.target.value)}
                placeholder={copy.productReviews.namePlaceholder}
              />
              {errors.authorName && <p className="text-sm text-red-600">{errors.authorName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-rating">{copy.productReviews.ratingLabel}</Label>
              <select
                id="review-rating"
                value={data.rating ?? 5}
                onChange={(event) => setValue("rating", Number(event.target.value))}
                className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} {copy.productReviews.ratingOption}
                  </option>
                ))}
              </select>
              {errors.rating && <p className="text-sm text-red-600">{errors.rating}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-content">{copy.productReviews.contentLabel}</Label>
              <Textarea
                id="review-content"
                value={data.content ?? ""}
                onChange={(event) => setValue("content", event.target.value)}
                placeholder={copy.productReviews.contentPlaceholder}
                rows={6}
              />
              {errors.content && <p className="text-sm text-red-600">{errors.content}</p>}
            </div>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}
            {submitMessage && <p className="text-sm text-green-700">{submitMessage}</p>}

            <Button
              onClick={() => void handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? copy.productReviews.submitting : copy.productReviews.submit}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
