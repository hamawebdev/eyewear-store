"use client";

import { useState } from "react";
import { z } from "zod";

export function useForm<T extends z.ZodType>(schema: T, initialData: Partial<z.infer<T>> = {}) {
  const [data, setData] = useState<Partial<z.infer<T>>>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof z.infer<T>, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = <K extends keyof z.infer<T>>(field: K, value: z.infer<T>[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const nextErrors = { ...prev };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const validate = () => {
    const result = schema.safeParse(data);

    if (result.success) {
      setErrors({});
      return true;
    }

    const nextErrors: Partial<Record<keyof z.infer<T>, string>> = {};

    result.error.issues.forEach((issue) => {
      const field = issue.path[0];

      if (typeof field === "string" && !nextErrors[field as keyof z.infer<T>]) {
        nextErrors[field as keyof z.infer<T>] = issue.message;
      }
    });

    setErrors(nextErrors);
    return false;
  };

  const handleSubmit = async (onSubmit: (data: z.infer<T>) => Promise<void> | void) => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(data as z.infer<T>);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    data,
    errors,
    isSubmitting,
    setValue,
    validate,
    handleSubmit
  };
}
