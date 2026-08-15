"use client";

import { useId } from "react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import {
  formatStorefrontCurrency,
  resolveLocalizedText
} from "@/lib/storefront-language";
import type { ProductOption } from "@/lib/schemas";

type ModernRadioGroupProps = {
  options: ProductOption[];
  value: string;
  onValueChange: (value: string) => void;
};

export default function ModernRadioGroup({
  options,
  value,
  onValueChange,
}: ModernRadioGroupProps) {
  const id = useId();
  const { language } = useStorefrontLanguage();
  const copy = getStorefrontCopy(language);

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        <h3 className="font-semibold text-gray-900">{copy.productOptions.chooseSize}</h3>
      </div>

      <RadioGroup
        className="w-full gap-0 space-y-2 rounded-md *:rounded-full"
        value={value}
        onValueChange={onValueChange}
      >
        {options.map((option) => {
          const optionId = `${id}-${option.id}`;
          const optionLabel = resolveLocalizedText(option.label, language);

          return (
            <div
              key={optionId}
              className="border-input has-data-[state=checked]:bg-primary/95 relative flex flex-col gap-4 rounded-2xl border p-4 outline-none transition-colors has-data-[state=checked]:z-10 has-data-[state=checked]:text-primary-foreground"
            >
              <div className="group flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <RadioGroupItem
                    id={optionId}
                    value={option.id}
                    aria-label={`product-option-${option.id}`}
                    className="text-primary bg-accent data-[state=checked]:border-primary-foreground data-[state=checked]:bg-primary-foreground! data-[state=checked]:[&_svg]:fill-primary after:absolute after:inset-0"
                    aria-describedby={`${optionId}-price`}
                  />
                  <Label className="inline-flex items-center gap-2" htmlFor={optionId}>
                    <span dir="auto">{optionLabel}</span>
                    {option.originalPrice && (
                      <Badge
                        variant="outline"
                        className="rounded-sm border-green-500 bg-green-500/10 px-1.5 py-px text-xs text-green-600"
                      >
                        {copy.productOptions.save}{" "}
                        {formatStorefrontCurrency(option.originalPrice - option.price, language)}
                      </Badge>
                    )}
                  </Label>
                </div>

                <div
                  id={`${optionId}-price`}
                  className="flex items-center gap-2 text-sm leading-[inherit]"
                  dir="ltr"
                >
                  {option.originalPrice && (
                    <span className="text-muted-foreground group-has-checked:text-primary-foreground/70 line-through">
                      {formatStorefrontCurrency(option.originalPrice, language)}
                    </span>
                  )}
                  <span className="font-semibold">
                    {formatStorefrontCurrency(option.price, language)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
