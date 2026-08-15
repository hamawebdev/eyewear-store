"use client";

import { useId } from "react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export type ShippingMethodOption = {
  value: string;
  label: string;
  priceLabel: string;
  description?: string;
  badge?: string;
};

type ShippingMethodRadioProps = {
  options: readonly ShippingMethodOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
};

export default function ShippingMethodRadio({
  options,
  value,
  onValueChange,
  className
}: ShippingMethodRadioProps) {
  const id = useId();

  return (
    <RadioGroup
      className={cn("w-full gap-0 space-y-2 rounded-md", className)}
      value={value}
      onValueChange={onValueChange}
    >
      {options.map((item) => {
        const itemId = `${id}-${item.value}`;
        const descriptionId = item.description ? `${itemId}-description` : undefined;
        const priceId = `${itemId}-price`;
        const describedBy = [descriptionId, priceId].filter(Boolean).join(" ");

        return (
          <div
            key={itemId}
            className="border-input has-data-[state=checked]:bg-primary has-data-[state=checked]:text-primary-foreground relative flex flex-col gap-2 rounded-xl border p-4 outline-none has-data-[state=checked]:z-10"
          >
            <div className="group flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  id={itemId}
                  value={item.value}
                  aria-label={`shipping-method-${item.value}`}
                  className="text-primary bg-accent data-[state=checked]:border-primary-foreground data-[state=checked]:bg-primary-foreground! data-[state=checked]:[&_svg]:fill-primary after:absolute after:inset-0"
                  aria-describedby={describedBy || undefined}
                />
                <Label className="inline-flex items-center" htmlFor={itemId}>
                  {item.label}
                  {item.badge && (
                    <Badge
                      variant="outline"
                      className="rounded-sm border-green-500 bg-green-500/10 px-1.5 py-px text-xs text-green-600"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Label>
              </div>
              <div
                id={priceId}
                className="group-has-checked:text-primary-foreground text-sm leading-[inherit] font-medium"
              >
                {item.priceLabel}
              </div>
            </div>

            {item.description && (
              <p
                id={descriptionId}
                className="text-muted-foreground group-has-checked:text-primary-foreground/80 pl-6 text-sm rtl:pr-6 rtl:pl-0"
              >
                {item.description}
              </p>
            )}
          </div>
        );
      })}
    </RadioGroup>
  );
}
