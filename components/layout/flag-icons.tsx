import type { ReactElement } from "react";
import type { StorefrontLanguage } from "@/lib/storefront-language";

type FlagProps = {
  className?: string;
};

/**
 * Flags are drawn in a square viewBox so they stay centred when the wrapper
 * clips them to a circle. Inline SVG (rather than emoji) so the flags render
 * identically on every platform — emoji flags fall back to letter pairs
 * ("SA", "GB", "FR") on Windows.
 */

function SaudiArabiaFlag({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <rect width="24" height="24" fill="#006C35" />
      {/* Shahada, stylised: a calligraphic baseline plus the tall ascenders that
          make Arabic script read as script — not as bars — at icon size */}
      <g stroke="#fff" strokeLinecap="round" fill="none">
        <path d="M4.5 11.2h15" strokeWidth="1" />
        <path
          d="M6.2 11.2V8.1M8.4 11.2V7.4M10.6 11.2V8.4M14.1 11.2V7.6M16.3 11.2V8.2M18.4 11.2V7.9"
          strokeWidth="1"
        />
        <path d="M7.4 13h2.2M11.6 13h1.9M15 13h2.4" strokeWidth="0.85" />
      </g>
      {/* Sword: blade pointing left, guard and grip to the right */}
      <path d="M3.4 17.4 6.4 16.6h9.3v1.6H6.4Z" fill="#fff" />
      <rect x="15.6" y="15.9" width="0.9" height="3" rx="0.45" fill="#fff" />
      <rect x="16.8" y="16.8" width="3.2" height="1.1" rx="0.55" fill="#fff" />
    </svg>
  );
}

function UnitedKingdomFlag({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <rect width="24" height="24" fill="#012169" />
      <g strokeLinecap="butt">
        {/* Saltire of St Andrew, then St Patrick over it */}
        <path d="M0 0 24 24M24 0 0 24" stroke="#fff" strokeWidth="5" />
        <path d="M0 0 24 24M24 0 0 24" stroke="#C8102E" strokeWidth="2.4" />
        {/* Cross of St George */}
        <path d="M12 0v24M0 12h24" stroke="#fff" strokeWidth="8" />
        <path d="M12 0v24M0 12h24" stroke="#C8102E" strokeWidth="4.8" />
      </g>
    </svg>
  );
}

function FranceFlag({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <rect width="8" height="24" fill="#002654" />
      <rect x="8" width="8" height="24" fill="#fff" />
      <rect x="16" width="8" height="24" fill="#CE1126" />
    </svg>
  );
}

const FLAGS: Record<StorefrontLanguage, (props: FlagProps) => ReactElement> = {
  ar: SaudiArabiaFlag,
  en: UnitedKingdomFlag,
  fr: FranceFlag
};

/** Accessible names only — never rendered as visible text. */
export const LANGUAGE_A11Y_LABELS: Record<StorefrontLanguage, string> = {
  ar: "العربية",
  en: "English",
  fr: "Français"
};

export default function FlagIcon({
  language,
  className
}: {
  language: StorefrontLanguage;
  className?: string;
}) {
  const Flag = FLAGS[language];
  return <Flag className={className} />;
}
