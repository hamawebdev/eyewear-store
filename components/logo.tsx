import Image from "next/image";
import LocalizedLink from "@/components/localized-link";
import { BRAND } from "@/lib/brand";

export default function Logo() {
  return (
    <LocalizedLink href="/" className="text-foreground flex items-center">
      <Image
        src="/logo.svg"
        alt={`${BRAND.name} logo`}
        width={220}
        height={48}
        className="h-8 w-auto lg:h-10"
      />
    </LocalizedLink>
  );
}
