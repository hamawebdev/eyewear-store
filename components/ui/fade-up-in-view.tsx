"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FadeUpInViewProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  amount?: number;
}

export default function FadeUpInView({
  children,
  className,
  delay = 0,
  amount = 0.35
}: FadeUpInViewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}s`;
          el.classList.add("fade-up-visible");
          observer.unobserve(el);
        }
      },
      { threshold: amount }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, amount]);

  return (
    <div ref={ref} className={cn("fade-up-initial", className)}>
      {children}
    </div>
  );
}
