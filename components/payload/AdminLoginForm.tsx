"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const getErrorMessage = (value: unknown): string => {
  if (!value || typeof value !== "object") {
    return "Unable to sign in. Please try again.";
  }

  if ("errors" in value && Array.isArray(value.errors) && value.errors[0]?.message) {
    return String(value.errors[0].message);
  }

  if ("message" in value && typeof value.message === "string") {
    return value.message;
  }

  return "Unable to sign in. Please try again.";
};

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admins/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password
        })
      });
      const result = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        setError(getErrorMessage(result));
        return;
      }

      window.location.assign("/admin");
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-[0_24px_80px_rgba(68,64,60,0.12)]">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-stone-500 uppercase">
            Payload Admin
          </p>
          <h1 className="text-3xl font-semibold text-stone-900">Admin sign in</h1>
          <p className="text-sm text-stone-600">
            Use the seeded admin account to access the dashboard.
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="admin-email">
              Email
            </label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="admin-password">
              Password
            </label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
