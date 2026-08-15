"use client";

import Image from "next/image";
import LocalizedLink from "@/components/localized-link";
import { Heart } from "lucide-react";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import {
  formatStorefrontCurrency,
  resolveLocalizedText
} from "@/lib/storefront-language";
import { useCartStore } from "@/stores/cartStore";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import { trackPixel } from "@/lib/meta/pixel.client";
import { getMetaCurrency } from "@/lib/meta/config";
import { META_EVENTS, buildMetaContentId } from "@/lib/meta/events";
import type { Product } from "@/lib/schemas";
import { shouldSkipImageOptimization, getStorefrontImagePlaceholderProps } from "@/lib/storefront-image";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { language } = useStorefrontLanguage();
  const addItem = useCartStore((state) => state.addItem);
  const defaultOption = product.options?.find((option) => option.isDefault) ?? product.options?.[0];
  const displayPrice = defaultOption?.price ?? product.price;
  const displayOriginalPrice = defaultOption?.originalPrice ?? product.originalPrice;
  const itemId = defaultOption ? `${product.id}:${defaultOption.id}` : product.id;
  const copy = getStorefrontCopy(language);
  const productName = resolveLocalizedText(product.name, language);
  const badge = product.badge ? resolveLocalizedText(product.badge, language) : "";

  const handleAddToCart = () => {
    addItem({
      id: itemId,
      image: product.image.src,
      name: product.name,
      optionId: defaultOption?.id,
      optionLabel: defaultOption?.label,
      price: displayPrice,
      productId: product.id,
      productSlug: product.slug,
      quantity: 1
    });

    trackPixel(META_EVENTS.addToCart, {
      value: displayPrice,
      currency: getMetaCurrency(),
      content_type: "product",
      content_name: productName,
      content_ids: [buildMetaContentId(product.id, defaultOption?.id)],
      contents: [
        {
          id: buildMetaContentId(product.id, defaultOption?.id),
          quantity: 1,
          item_price: displayPrice
        }
      ],
      num_items: 1
    });
  };

  return (
    <div className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-lg [transform:translateZ(0)]">
      <div className="relative aspect-square overflow-hidden [transform:translateZ(0)]">
        {badge ? (
          <span className="bg-primary absolute top-3 left-3 z-10 rounded-full px-2 py-1 text-xs font-medium text-white">
            {badge}
          </span>
        ) : null}
        <button className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100">
          <Heart className="h-4 w-4 text-gray-600" />
        </button>
        <LocalizedLink href={`/products/${product.slug}`}>
          <Image
            src={product.image.src}
            alt={product.image.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized={shouldSkipImageOptimization(product.image.src)}
            {...getStorefrontImagePlaceholderProps(product.image)}
          />
        </LocalizedLink>
      </div>

      <div className="p-4">
        <LocalizedLink href={`/products/${product.slug}`}>
          <h3 className="hover:text-primary mb-2 line-clamp-2 font-semibold text-gray-900 transition-colors">
            {productName}
          </h3>
        </LocalizedLink>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900" dir="ltr">
              {formatStorefrontCurrency(displayPrice, language)}
            </span>
            {displayOriginalPrice && (
              <span className="text-sm text-gray-500 line-through" dir="ltr">
                {formatStorefrontCurrency(displayOriginalPrice, language)}
              </span>
            )}
          </div>
        </div>

        <Button onClick={handleAddToCart} className="w-full" size="sm">
          {copy.productCard.addToCart}
        </Button>
      </div>
    </div>
  );
}
