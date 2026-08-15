"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import {
  formatStorefrontCurrency,
  resolveLocalizedText
} from "@/lib/storefront-language";
import { useCartStore } from "@/stores/cartStore";
import LocalizedLink from "@/components/localized-link";
import { shouldSkipImageOptimization } from "@/lib/storefront-image";

export default function CartPage() {
  const { language } = useStorefrontLanguage();
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();
  const copy = getStorefrontCopy(language);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">{copy.cart.emptyTitle}</h1>
        <p className="text-muted-foreground mb-8">
          {copy.cart.emptyDescription}
        </p>
        <LocalizedLink href="/products">
          <Button size="lg">{copy.cart.continueShopping}</Button>
        </LocalizedLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">{copy.cart.title}</h1>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="divide-y divide-gray-200">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-6">
              <div className="flex w-full items-start gap-4 sm:w-auto sm:flex-1">
                <Image
                  src={item.image || "/placeholder.svg"}
                  alt={resolveLocalizedText(item.name, language)}
                  width={80}
                  height={80}
                  sizes="80px"
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  unoptimized={shouldSkipImageOptimization(item.image || "/placeholder.svg")}
                />

                <div className="flex-1">
                  <h3 className="line-clamp-2 font-semibold text-gray-900" dir="auto">
                    {resolveLocalizedText(item.name, language)}
                  </h3>
                  {item.optionLabel ? (
                    <p className="text-muted-foreground mt-1 line-clamp-1 text-sm" dir="auto">
                      {resolveLocalizedText(item.optionLabel, language)}
                    </p>
                  ) : null}
                  <p className="text-muted-foreground mt-1" dir="ltr">
                    {formatStorefrontCurrency(item.price, language)}
                  </p>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-red-500 hover:text-red-700 sm:hidden">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-2 flex w-full items-center justify-between gap-3 sm:mt-0 sm:w-auto sm:justify-end sm:gap-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-right rtl:text-left">
                  <p className="font-semibold text-gray-900" dir="ltr">
                    {formatStorefrontCurrency(item.price * item.quantity, language)}
                  </p>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="hidden p-2 text-red-500 hover:text-red-700 sm:block">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-lg font-semibold">{copy.cart.total} :</span>
            <span className="text-primary text-2xl font-bold" dir="ltr">
              {formatStorefrontCurrency(getTotal(), language)}
            </span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <LocalizedLink href="/products" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                {copy.cart.continueShopping}
              </Button>
            </LocalizedLink>
            <LocalizedLink href="/checkout" className="flex-1">
              <Button className="w-full" size="lg">
                {copy.cart.checkout}
              </Button>
            </LocalizedLink>
          </div>
        </div>
      </div>
    </div>
  );
}
