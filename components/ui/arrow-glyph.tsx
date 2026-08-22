import { cn } from "@/lib/utils";

/**
 * Forward arrow for text CTAs. Points along the reading direction and mirrors
 * in RTL. Shared so the storefront's CTAs cannot drift apart.
 */
export default function ArrowGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 12"
      aria-hidden="true"
      className={cn(
        "h-3 w-5 shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] rtl:rotate-180",
        "group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0",
        className
      )}
    >
      <path
        d="M0 6h17M12 1l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
