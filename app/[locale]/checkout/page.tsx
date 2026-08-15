"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from "@/components/animate-ui/components/radix/dropdown-menu";
import ShippingMethodRadio, {
  type ShippingMethodOption
} from "@/components/mvpblocks/shipping-method-radio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore } from "@/stores/cartStore";
import { useForm } from "@/hooks/useForm";
import { getWilayas } from "@/app/[locale]/checkout/actions";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import { trackPixel } from "@/lib/meta/pixel.client";
import { getMetaCurrency } from "@/lib/meta/config";
import { META_EVENTS, buildMetaContentsFromCart } from "@/lib/meta/events";
import { buildCheckoutSchema, type CheckoutForm } from "@/lib/orders/schemas";
import {
  formatStorefrontCurrency,
  resolveLocalizedText
} from "@/lib/storefront-language";
import { shouldSkipImageOptimization } from "@/lib/storefront-image";
import { cn } from "@/lib/utils";

export default function CheckoutPage() {
  const { language } = useStorefrontLanguage();
  const { items, getTotal, clearCart } = useCartStore();
  const router = useRouter();
  const checkoutSchema = buildCheckoutSchema(language);
  const { data, errors, isSubmitting, setValue, handleSubmit } = useForm(checkoutSchema, {
    shippingMethod: "home"
  });
  const copy = getStorefrontCopy(language);
  const [submissionKey] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `checkout-${Date.now()}`
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wilayasData, setWilayasData] = useState<Awaited<ReturnType<typeof getWilayas>>>([]);

  useEffect(() => {
    getWilayas().then(setWilayasData).catch(console.error);
  }, []);

  // Fire the Meta InitiateCheckout event once on mount with the current cart.
  // value uses the cart subtotal (shipping is not yet known before a wilaya is
  // chosen). Empty carts are skipped.
  const hasFiredInitiateCheckout = useRef(false);
  useEffect(() => {
    if (hasFiredInitiateCheckout.current || items.length === 0) {
      return;
    }
    hasFiredInitiateCheckout.current = true;

    trackPixel(META_EVENTS.initiateCheckout, {
      value: items.reduce((total, item) => total + item.price * item.quantity, 0),
      currency: getMetaCurrency(),
      content_type: "product",
      ...buildMetaContentsFromCart(items)
    });
  }, [items]);

  const onSubmit = async (formData: CheckoutForm) => {
    setSubmitError(null);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...formData,
        locale: language,
        items: items.map((item) => ({
          optionId: item.optionId,
          productId: item.productId,
          quantity: item.quantity
        })),
        submissionKey
      })
    });
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      orderRef?: string;
    } | null;

    if (!response.ok || !payload?.orderRef) {
      const fallbackError =
        language === "ar"
          ? "تعذر تسجيل طلبك في الوقت الحالي."
          : language === "fr"
          ? "Impossible d'enregistrer votre commande pour le moment."
          : "We couldn't place your order right now.";
      setSubmitError(payload?.message || fallbackError);
      return;
    }

    // Browser-side Purchase. Uses orderRef as the dedup event_id so Meta counts
    // this once alongside the server-side Conversions API Purchase. Fired while
    // the cart and total are still in scope, before clearCart().
    trackPixel(
      META_EVENTS.purchase,
      {
        value: total,
        currency: getMetaCurrency(),
        content_type: "product",
        ...buildMetaContentsFromCart(items)
      },
      { eventID: payload.orderRef }
    );

    clearCart();
    router.push(`/${language}/thankyou`);
  };

  const subtotal = getTotal();
  const selectedWilayaObj = wilayasData.find((w) => w.name === data.wilaya);

  const homeDeliveryPrice = selectedWilayaObj?.homeDeliveryPrice ?? 0;
  const officeDeliveryPrice = selectedWilayaObj?.officeDeliveryPrice ?? 0;

  const shippingOptions: ShippingMethodOption[] = [
    {
      value: "office",
      label: copy.checkout.officePickup,
      priceLabel: selectedWilayaObj
        ? officeDeliveryPrice === 0
          ? copy.checkout.free
          : formatStorefrontCurrency(officeDeliveryPrice, language)
        : copy.checkout.free
    },
    {
      value: "home",
      label: copy.checkout.homeDelivery,
      priceLabel: selectedWilayaObj
        ? homeDeliveryPrice === 0
          ? copy.checkout.free
          : formatStorefrontCurrency(homeDeliveryPrice, language)
        : copy.checkout.free
    }
  ];
  const selectedShippingMethod =
    shippingOptions.find((option) => option.value === data.shippingMethod) ?? shippingOptions[1];
  const shipping = data.shippingMethod === "office" ? officeDeliveryPrice : homeDeliveryPrice;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">{copy.checkout.title}</h1>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Checkout Form */}
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit);
            }}
            className="space-y-6"
          >
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                {copy.checkout.deliveryDetails}
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {copy.checkout.fullName}
                  </label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={copy.checkout.fullNamePlaceholder}
                    value={data.fullName || ""}
                    onChange={(e) => setValue("fullName", e.target.value)}
                    className={errors.fullName ? "border-red-500" : ""}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {copy.checkout.phoneNumber}
                  </label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder={copy.checkout.phonePlaceholder}
                    value={data.phoneNumber || ""}
                    onChange={(e) => setValue("phoneNumber", e.target.value)}
                    className={errors.phoneNumber ? "border-red-500" : ""}
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {copy.checkout.wilaya}
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className={cn(
                          "w-full justify-between font-normal",
                          !data.wilaya && "text-muted-foreground",
                          errors.wilaya && "border-red-500"
                        )}
                      >
                        <span>{data.wilaya || copy.checkout.selectWilaya}</span>
                        <ChevronDown className="size-4 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="max-h-80"
                      style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
                    >
                      <DropdownMenuRadioGroup
                        value={data.wilaya || ""}
                        onValueChange={(value) => setValue("wilaya", value)}
                      >
                        {wilayasData.map((wilaya) => (
                          <DropdownMenuRadioItem key={wilaya.code} value={wilaya.name}>
                            {wilaya.name}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {errors.wilaya && <p className="mt-1 text-sm text-red-600">{errors.wilaya}</p>}
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-700">
                    {copy.checkout.shippingMethod}
                  </h3>
                  <ShippingMethodRadio
                    options={shippingOptions}
                    value={data.shippingMethod || ""}
                    onValueChange={(value) =>
                      setValue("shippingMethod", value as "home" | "office")
                    }
                  />
                  {errors.shippingMethod && (
                    <p className="mt-1 text-sm text-red-600">{errors.shippingMethod}</p>
                  )}
                </div>

                {data.shippingMethod === "home" ? (
                  <div>
                    <label
                      htmlFor="address"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      {copy.checkout.address}
                    </label>
                    <Textarea
                      id="address"
                      placeholder={copy.checkout.addressPlaceholder}
                      value={data.address || ""}
                      onChange={(e) => setValue("address", e.target.value)}
                      className={errors.address ? "border-red-500" : ""}
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {submitError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? copy.checkout.processing : copy.checkout.placeOrder}
            </Button>
          </form>
        </div>

        {/* Order Summary */}
        <div>
          <div className="sticky top-8 rounded-xl bg-gray-50 p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              {copy.checkout.orderSummary}
            </h2>

            <div className="mb-6 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={resolveLocalizedText(item.name, language)}
                    width={64}
                    height={64}
                    sizes="64px"
                    className="h-16 w-16 rounded-lg object-cover"
                    unoptimized={shouldSkipImageOptimization(item.image || "/placeholder.svg")}
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900" dir="auto">
                      {resolveLocalizedText(item.name, language)}
                    </h3>
                    {item.optionLabel ? (
                      <p className="text-muted-foreground text-xs" dir="auto">
                        {resolveLocalizedText(item.optionLabel, language)}
                      </p>
                    ) : null}
                    <p className="text-muted-foreground text-sm">
                      {copy.checkout.quantity} : {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium" dir="ltr">
                    {formatStorefrontCurrency(item.price * item.quantity, language)}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-gray-200 pt-4">
              <div className="flex justify-between">
                <span>{copy.checkout.subtotal}</span>
                <span dir="ltr">{formatStorefrontCurrency(subtotal, language)}</span>
              </div>
              <div className="flex justify-between">
                <span>{selectedShippingMethod.label}</span>
                <span dir="ltr">
                  {shipping === 0
                    ? copy.checkout.free
                    : formatStorefrontCurrency(shipping, language)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-semibold">
                <span>{copy.checkout.total}</span>
                <span dir="ltr">{formatStorefrontCurrency(total, language)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
