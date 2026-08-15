"use client";

import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/brand/brand-mark";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  href?: "/" | "/app";
};

export function BrandLogo({ className, href = "/" }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-3 rounded-full outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      aria-label="ArabTechLeads"
    >
      <BrandMark size={36} showHoverGlow />

      <span className="flex min-w-0 flex-col justify-center leading-none">
        <span className="text-[15px] font-semibold tracking-[-0.03em] text-foreground sm:text-[16px]">
          Arab
          <span className="text-muted transition-colors duration-200 group-hover:text-secondary">
            Tech
          </span>
          <span className="text-accent transition-colors duration-200 group-hover:text-accent-hover">
            Leads
          </span>
        </span>
        <span className="mt-[5px] flex items-center gap-1.5">
          <span className="h-px w-3 bg-accent/45 transition-all duration-300 group-hover:w-4 group-hover:bg-accent" />
          <span className="font-mono text-[9px] font-medium tracking-[0.22em] text-muted uppercase transition-colors duration-200 group-hover:text-secondary">
            Network
          </span>
        </span>
      </span>
    </Link>
  );
}
