"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import type { OrderLookupResult } from "@/lib/orders/schemas";
import { formatMinorCurrency } from "@/lib/orders/utils";
import { getStorefrontLocale } from "@/lib/storefront-language";

type LookupState =
  | {
      error: string;
      result: null;
      status: "error";
    }
  | {
      error: null;
      result: OrderLookupResult | null;
      status: "idle" | "loading" | "success";
    };

export default function OrderLookupClient() {
  const { direction, language } = useStorefrontLanguage();
  const searchParams = useSearchParams();
  const initialOrderRef = searchParams.get("orderRef") ?? "";
  const [orderRef, setOrderRef] = useState(initialOrderRef);
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<LookupState>({
    error: null,
    result: null,
    status: "idle"
  });
  const copy = getStorefrontCopy(language);
  const statusLabels = useMemo(
    () => ({
      confirmationStatus: {
        confirmed: language === "ar" ? "مؤكد" : "Confirmed",
        pending: language === "ar" ? "قيد الانتظار" : "Pending",
        rejected: language === "ar" ? "مرفوض" : "Rejected",
        unreachable: language === "ar" ? "غير قابل للوصول" : "Unreachable"
      },
      exchangeStatus: {
        approved: language === "ar" ? "مقبول" : "Approved",
        completed: language === "ar" ? "مكتمل" : "Completed",
        declined: language === "ar" ? "مرفوض" : "Declined",
        none: language === "ar" ? "لا يوجد" : "None",
        requested: language === "ar" ? "مطلوب" : "Requested",
        shipped: language === "ar" ? "تم الإرسال" : "Shipped"
      },
      lifecycleStatus: {
        cancelled: language === "ar" ? "ملغى" : "Cancelled",
        confirmed: language === "ar" ? "مؤكد" : "Confirmed",
        delivered: language === "ar" ? "تم التسليم" : "Delivered",
        delivery_failed: language === "ar" ? "فشل التوصيل" : "Delivery failed",
        in_transit: language === "ar" ? "في الطريق" : "In transit",
        new: language === "ar" ? "جديد" : "New",
        preparing: language === "ar" ? "قيد التحضير" : "Preparing",
        returned: language === "ar" ? "مرتجع" : "Returned",
        submitted_to_courier: language === "ar" ? "تم إرساله لشركة التوصيل" : "Submitted to courier"
      },
      paymentStatus: {
        cancelled: language === "ar" ? "ملغى" : "Cancelled",
        paid: language === "ar" ? "مدفوع" : "Paid",
        pending_cod: language === "ar" ? "الدفع عند الاستلام" : "Cash on delivery"
      }
    }),
    [language]
  );

  const statusLabel = useMemo(() => {
    if (!state.result) {
      return "";
    }

    return statusLabels.lifecycleStatus[state.result.order.lifecycleStatus];
  }, [state.result, statusLabels.lifecycleStatus]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState({
      error: null,
      result: null,
      status: "loading"
    });

    try {
      const query = new URLSearchParams({
        orderRef,
        phone
      });
      const response = await fetch(`/api/orders/lookup?${query.toString()}`, {
        method: "GET"
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | OrderLookupResult
        | null;

      if (!response.ok) {
        setState({
          error: (payload as { message?: string } | null)?.message || copy.orderLookup.error,
          result: null,
          status: "error"
        });
        return;
      }

      setState({
        error: null,
        result: payload as OrderLookupResult,
        status: "success"
      });
    } catch {
      setState({
        error: copy.orderLookup.error,
        result: null,
        status: "error"
      });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8" dir={direction}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold tracking-[0.22em] text-stone-500 uppercase">
            {copy.orderLookup.guestLookup}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-900">{copy.orderLookup.title}</h1>
          <p className="text-muted-foreground mt-3 text-sm">
            {copy.orderLookup.intro}
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="lookup-order-ref">
                {copy.orderLookup.orderRef}
              </label>
              <Input
                id="lookup-order-ref"
                value={orderRef}
                onChange={(event) => setOrderRef(event.target.value.toUpperCase())}
                placeholder={copy.orderLookup.placeholderOrderRef}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="lookup-phone">
                {copy.orderLookup.phoneNumber}
              </label>
              <Input
                id="lookup-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={copy.orderLookup.placeholderPhone}
                required
              />
            </div>

            {state.status === "error" ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </div>
            ) : null}

            <Button className="w-full" type="submit" disabled={state.status === "loading"}>
              {state.status === "loading" ? copy.orderLookup.loading : copy.orderLookup.lookupAction}
            </Button>
          </form>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
          {state.result ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold tracking-[0.22em] text-emerald-700 uppercase">
                    {statusLabel}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-stone-900">
                    {state.result.order.orderRef}
                  </h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {state.result.customer.fullName} ·{" "}
                    {state.result.order.deliveryDestination.commune},{" "}
                    {state.result.order.deliveryDestination.wilaya}
                  </p>
                </div>

                <div className="rounded-2xl bg-white px-5 py-4 text-left shadow-sm rtl:text-right">
                  <p className="text-xs tracking-[0.18em] text-stone-500 uppercase">{copy.orderLookup.total}</p>
                  <p className="mt-1 text-xl font-semibold text-stone-900">
                    {formatMinorCurrency(
                      state.result.order.totalMinor,
                      state.result.order.currency,
                      getStorefrontLocale(language)
                    )}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs tracking-[0.18em] text-stone-500 uppercase">{copy.orderLookup.confirmation}</p>
                  <p className="mt-2 text-base font-medium text-stone-900">
                    {statusLabels.confirmationStatus[state.result.order.confirmationStatus]}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs tracking-[0.18em] text-stone-500 uppercase">{copy.orderLookup.payment}</p>
                  <p className="mt-2 text-base font-medium text-stone-900">
                    {statusLabels.paymentStatus[state.result.order.paymentStatus]}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs tracking-[0.18em] text-stone-500 uppercase">{copy.orderLookup.exchange}</p>
                  <p className="mt-2 text-base font-medium text-stone-900">
                    {statusLabels.exchangeStatus[state.result.order.exchangeStatus]}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-xs tracking-[0.18em] text-stone-500 uppercase">
                  {copy.orderLookup.courierDetails}
                </p>
                <div className="mt-3 space-y-2 text-sm text-stone-700">
                  <p>
                    {copy.orderLookup.courierProvider} :{" "}
                    {state.result.courier?.provider || copy.orderLookup.courierUnassigned}
                  </p>
                  <p dir="ltr">
                    {copy.orderLookup.courierTracking} :{" "}
                    {state.result.courier?.trackingNumber || copy.orderLookup.notAssigned}
                  </p>
                  {state.result.courier?.trackingURL ? (
                    <a
                      className="text-emerald-700 underline underline-offset-4"
                      href={state.result.courier.trackingURL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {copy.orderLookup.courierTrackingLink}
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-xs tracking-[0.18em] text-stone-500 uppercase">
                  {copy.orderLookup.openTimeline}
                </p>
                <div className="mt-4 space-y-4">
                  {state.result.events.length > 0 ? (
                    state.result.events.map((event) => (
                      <div
                        key={`${event.createdAt}-${event.eventType}`}
                        className="border-l-2 border-emerald-200 pl-4 rtl:border-r-2 rtl:border-l-0 rtl:pr-4 rtl:pl-0"
                      >
                        <p className="text-sm font-medium text-stone-900">{event.message}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {new Date(event.createdAt).toLocaleString(getStorefrontLocale(language))}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      {copy.orderLookup.noTimeline}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[24rem] items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/70 p-6 text-center">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-stone-500 uppercase">
                  {copy.orderLookup.emptyTitle}
                </p>
                <p className="text-muted-foreground mt-3 max-w-md text-sm">
                  {copy.orderLookup.emptyState}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
