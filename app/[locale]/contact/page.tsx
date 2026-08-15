"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import { useForm } from "@/hooks/useForm";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import { ContactSchema, type ContactForm } from "@/lib/schemas";
import { BRAND, toTelHref } from "@/lib/brand";
import WhatsappButton from "@/components/whatsapp-button";

export default function ContactPage() {
  const { direction, language } = useStorefrontLanguage();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { data, errors, isSubmitting, setValue, handleSubmit } = useForm(ContactSchema);
  const copy = getStorefrontCopy(language);

  const onSubmit = async (formData: ContactForm) => {
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Contact form submitted:", formData);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8" dir={direction}>
        <div className="rounded-lg border border-green-200 bg-green-50 p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Send className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-green-800">{copy.contact.successTitle}</h2>
          <p className="mb-4 text-green-700">{copy.contact.successBody}</p>
          <Button
            onClick={() => setIsSubmitted(false)}
            variant="outline"
            className="bg-transparent">
            {copy.contact.reset}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" dir={direction}>
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">{copy.contact.title}</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          {copy.contact.intro}
        </p>
      </div>

      <div className="mx-auto max-w-3xl">
        {/* Contact Numbers — rendered only once BRAND.phones is filled in. */}
        {BRAND.phones.length > 0 && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {BRAND.phones.map((phone) => (
              <Button
                key={phone}
                variant="outline"
                className="flex h-16 items-center justify-center gap-3 rounded-xl border-gray-200 bg-white text-lg font-medium shadow-sm hover:bg-gray-50"
                dir="ltr"
                onClick={() => window.open(toTelHref(phone))}
              >
                <div className="bg-accent/15 flex h-10 w-10 items-center justify-center rounded-full">
                  <Phone className="text-accent h-5 w-5" />
                </div>
                {phone}
              </Button>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            {copy.contact.writeMessage}
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit);
            }}
            className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium text-gray-700">
                  {copy.checkout.fullName} *
                </label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={data.fullName || ""}
                  onChange={(e) => setValue("fullName", e.target.value)}
                  className={errors.fullName ? "border-red-500" : ""}
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                  {copy.contact.phoneLabel}
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0555 55 55 55"
                  value={data.phone || ""}
                  onChange={(e) => setValue("phone", e.target.value)}
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="mb-2 block text-sm font-medium text-gray-700">
                {copy.contact.subjectLabel}
              </label>
              <select
                id="subject"
                value={data.subject || ""}
                onChange={(e) => setValue("subject", e.target.value)}
                className={`focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2 outline-none ${errors.subject ? "border-red-500" : "border-gray-300"
                  }`}>
                {copy.contact.subjects.map((subject) => (
                  <option key={subject.value || "empty"} value={subject.value}>
                    {subject.label}
                  </option>
                ))}
              </select>
              {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-gray-700">
                {copy.contact.messageLabel}
              </label>
              <textarea
                id="message"
                rows={6}
                placeholder={copy.contact.messagePlaceholder}
                value={data.message || ""}
                onChange={(e) => setValue("message", e.target.value)}
                className={`focus:ring-primary w-full resize-none rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2 outline-none ${errors.message ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? copy.contact.submitting : copy.contact.submit}
            </Button>
          </form>
        </div>
      </div>



      {/* Additional Information */}
      <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        {copy.contact.additionalCards.map((card, index) => (
        <div key={card.title} className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            {index === 0 ? (
              <Phone className="text-accent h-8 w-8" />
            ) : index === 1 ? (
              <Mail className="h-8 w-8 text-green-600" />
            ) : (
              <MapPin className="h-8 w-8 text-purple-600" />
            )}
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{card.title}</h3>
          <p className="text-muted-foreground text-balance">{card.body}</p>
        </div>
        ))}
      </div>

      {/* WhatsApp Floating Button */}
      <WhatsappButton />
    </div>
  );
}
