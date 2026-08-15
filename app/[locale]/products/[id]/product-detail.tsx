"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Minus, Plus, Loader2 } from "lucide-react";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import { Button } from "@/components/ui/button";
import ModernRadioGroup from "@/components/ui/modern-radio-group";
import { useCartStore } from "@/stores/cartStore";
import { trackPixel } from "@/lib/meta/pixel.client";
import { getMetaCurrency } from "@/lib/meta/config";
import { META_EVENTS, buildMetaContentId } from "@/lib/meta/events";
import dynamic from "next/dynamic";
import ProductCard from "@/components/ProductCard";
import { Product, ProductReview } from "@/lib/schemas";

const ProductReviewsSection = dynamic(() => import("@/components/products/ProductReviewsSection"), {
  ssr: false,
  loading: () => (
    <section className="border-border mt-12 border-t pt-12 md:pt-16">
      <div className="bg-muted h-8 w-40 animate-pulse rounded" />
    </section>
  )
});
import { formatStorefrontCurrency, resolveLocalizedText } from "@/lib/storefront-language";
import {
  getStorefrontImagePlaceholderProps,
  isStoredStorefrontImage,
  shouldSkipImageOptimization
} from "@/lib/storefront-image";

type Props = { product: Product };

type SecondaryProps = {
  relatedProducts: Product[];
  approvedReviews: ProductReview[];
  productId: string;
  productName: { ar: string; fr: string; en: string };
};

type BuyNowButtonProps = {
  isLoading: boolean;
  onClick: () => void;
};

function BuyNowButton({ isLoading, onClick }: BuyNowButtonProps) {
  const { language } = useStorefrontLanguage();
  const copy = getStorefrontCopy(language);

  return (
    <Button
      onClick={onClick}
      className="h-auto w-full py-4 text-lg font-semibold sm:flex-1 sm:py-3"
      size="lg"
      variant="secondary"
      disabled={isLoading}
      aria-busy={isLoading}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isLoading ? copy.productDetail.redirecting : copy.productDetail.buyNow}
    </Button>
  );
}

function SecondaryContent({
  relatedProducts,
  approvedReviews,
  productId,
  productName
}: SecondaryProps) {
  const { language } = useStorefrontLanguage();
  const copy = getStorefrontCopy(language);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <ProductReviewsSection
        productId={productId}
        productName={productName}
        reviews={approvedReviews}
      />

      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-8 text-2xl font-bold text-gray-900">
            {copy.productDetail.relatedProducts}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage({ product }: Props) {
  const { language } = useStorefrontLanguage();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isBuyNowLoading, setIsBuyNowLoading] = useState(false);
  const [isCheckoutPending, startCheckoutTransition] = useTransition();
  const defaultOption =
    product?.options?.find((option) => option.isDefault) ?? product?.options?.[0];
  const [selectedOptionId, setSelectedOptionId] = useState(defaultOption?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const copy = getStorefrontCopy(language);

  useEffect(() => {
    setSelectedImage(0);
  }, [product?.id]);

  // Fire Meta ViewContent once per product. Uses the default option price; the
  // content id follows the cart convention "{productId}:{optionId}".
  useEffect(() => {
    if (!product) {
      return;
    }

    const viewedOption = product.options?.find((option) => option.isDefault) ?? product.options?.[0];
    trackPixel(META_EVENTS.viewContent, {
      value: viewedOption?.price ?? product.price,
      currency: getMetaCurrency(),
      content_type: "product",
      content_name: resolveLocalizedText(product.name, language),
      content_ids: [buildMetaContentId(product.id, viewedOption?.id)]
    });
    // language intentionally excluded: ViewContent should fire once per product,
    // not again on a language switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        {copy.productDetail.notFound}
      </div>
    );
  }

  const productName = resolveLocalizedText(product.name, language);
  const productImages = (product.images ?? []).filter(isStoredStorefrontImage);
  const primaryProductImage = isStoredStorefrontImage(product.image) ? product.image : undefined;
  const activeProductImage =
    productImages[selectedImage] ?? productImages[0] ?? primaryProductImage;
  const artboardImage = isStoredStorefrontImage(product.artboardImage)
    ? product.artboardImage
    : undefined;

  const selectedOption =
    product.options?.find((option) => option.id === selectedOptionId) ?? defaultOption;
  const displayPrice = selectedOption?.price ?? product.price;
  const displayOriginalPrice = selectedOption?.originalPrice ?? product.originalPrice;
  const selectedItemId = selectedOption ? `${product.id}:${selectedOption.id}` : product.id;
  const artboardAlt = `${productName}`;
  const selectedCartItem = {
    id: selectedItemId,
    name: product.name,
    optionId: selectedOption?.id,
    optionLabel: selectedOption?.label,
    price: displayPrice,
    image: activeProductImage?.src ?? product.image.src,
    productId: product.id,
    productSlug: product.slug,
    quantity
  };

  const trackAddToCart = () => {
    const contentId = buildMetaContentId(product.id, selectedOption?.id);
    trackPixel(META_EVENTS.addToCart, {
      value: displayPrice * quantity,
      currency: getMetaCurrency(),
      content_type: "product",
      content_name: productName,
      content_ids: [contentId],
      contents: [{ id: contentId, quantity, item_price: displayPrice }],
      num_items: quantity
    });
  };

  const handleAddToCart = () => {
    addItem(selectedCartItem);
    trackAddToCart();
  };

  const handleBuyNow = () => {
    if (isBuyNowLoading || isCheckoutPending) {
      return;
    }

    setIsBuyNowLoading(true);
    addItem(selectedCartItem);
    trackAddToCart();
    startCheckoutTransition(() => {
      router.push("/checkout");
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className={`grid grid-cols-1 gap-12 ${activeProductImage ? "lg:grid-cols-2" : ""}`}>
        {/* Product Images */}
        {activeProductImage ? (
          <div className="space-y-4">
            <div className="aspect-square [transform:translateZ(0)] overflow-hidden rounded-xl bg-gray-100">
              <div className="relative h-full w-full">
                <Image
                  src={activeProductImage.src}
                  alt={activeProductImage.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  unoptimized={shouldSkipImageOptimization(activeProductImage.src)}
                  {...getStorefrontImagePlaceholderProps(activeProductImage)}
                />
              </div>
            </div>
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {productImages.map((image, index) => (
                  <button
                    key={image.src}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 bg-gray-100 ${
                      selectedImage === index ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <div className="relative h-full w-full">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 1024px) 25vw, 120px"
                        className="object-cover"
                        unoptimized={shouldSkipImageOptimization(image.src)}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">{productName}</h1>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating) ? "text-primary fill-current" : "text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-muted-foreground text-sm">
                ({product.reviews} {copy.productDetail.reviewsLabel})
              </span>
            </div>
            <div className="flex items-center gap-4" dir="ltr">
              <span className="text-3xl font-bold text-gray-900">
                {formatStorefrontCurrency(displayPrice, language)}
              </span>
              {displayOriginalPrice && (
                <span className="text-xl text-gray-500 line-through">
                  {formatStorefrontCurrency(displayOriginalPrice, language)}
                </span>
              )}
            </div>
          </div>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">
              {resolveLocalizedText(product.description, language)}
            </p>
          )}

          {product.options && product.options.length > 0 && (
            <ModernRadioGroup
              options={product.options}
              value={selectedOptionId}
              onValueChange={setSelectedOptionId}
            />
          )}

          {/* Quantity */}
          <div>
            <h3 className="mb-3 font-semibold text-gray-900">{copy.productDetail.quantity}</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              onClick={handleAddToCart}
              className="h-auto w-full py-4 text-lg font-semibold sm:flex-1 sm:py-3"
              size="lg"
              disabled={isBuyNowLoading || isCheckoutPending}
            >
              {copy.productDetail.addToCart}
            </Button>
            <BuyNowButton onClick={handleBuyNow} isLoading={isBuyNowLoading || isCheckoutPending} />
          </div>

          <div className="space-y-6 border-t pt-6">
            {/* Features */}
            {product.features && (
              <div>
                <h3 className="mb-3 font-semibold text-gray-900">{copy.productDetail.keyPoints}</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="bg-primary h-2 w-2 rounded-full" />
                      <span className="text-muted-foreground">
                        {resolveLocalizedText(feature, language)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {artboardImage ? (
              <div className="sm:max-w-[15rem] lg:max-w-[17rem]">
                <div className="relative right-1/2 left-1/2 mr-[-50vw] ml-[-50vw] w-screen max-w-none overflow-hidden sm:right-auto sm:left-auto sm:mx-0 sm:w-full sm:rounded-2xl">
                  <Image
                    src={artboardImage.src}
                    alt={artboardImage.alt || artboardAlt}
                    width={artboardImage.width}
                    height={artboardImage.height}
                    sizes="(max-width: 640px) 100vw, 272px"
                    className="h-auto w-full object-contain"
                    unoptimized={shouldSkipImageOptimization(artboardImage.src)}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export { SecondaryContent as ProductDetailSecondary };
