import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import FacebookIcon from "@/components/ui/facebook-icon";
import InstagramIcon from "@/components/ui/instagram-icon";

/**
 * The brand's social profiles, as icon buttons. Each button borrows its
 * network's colour on hover so the icons read as themselves rather than as a
 * row of anonymous glyphs. A profile with an empty URL in {@link BRAND} is
 * skipped, the same way the phone and email affordances hide themselves.
 */
const NETWORKS = [
  {
    name: "Instagram",
    href: BRAND.social.instagram,
    Icon: InstagramIcon,
    hover: "hover:border-[#E1306C] hover:bg-[#E1306C] focus-visible:border-[#E1306C] focus-visible:bg-[#E1306C]"
  },
  {
    name: "Facebook",
    href: BRAND.social.facebook,
    Icon: FacebookIcon,
    hover: "hover:border-[#1877F2] hover:bg-[#1877F2] focus-visible:border-[#1877F2] focus-visible:bg-[#1877F2]"
  }
] as const;

export default function SocialLinks({
  label,
  className
}: {
  /** Optional heading above the row, e.g. "Follow us". Already localized. */
  label?: string;
  className?: string;
}) {
  const networks = NETWORKS.filter((network) => network.href.length > 0);
  if (networks.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label ? (
        <p className="text-muted-foreground text-sm font-medium tracking-wide">{label}</p>
      ) : null}
      <div className="flex items-center gap-3">
        {networks.map(({ name, href, Icon, hover }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label={name}
            title={name}
            className={cn(
              "text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full border border-gray-200",
              "transition-colors duration-300 hover:text-white focus-visible:text-white",
              "focus-visible:ring-accent/40 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              hover
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </a>
        ))}
      </div>
    </div>
  );
}
