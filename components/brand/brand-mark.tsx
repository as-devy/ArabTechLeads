"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: number;
  showHoverGlow?: boolean;
};

export function BrandMark({
  className,
  size = 36,
  showHoverGlow = false,
}: Props) {
  const glowId = useId();
  const fontSize = Math.max(9, size * 0.255);

  return (
    <span
      aria-hidden
      dir="ltr"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {showHoverGlow ? (
        <span className="absolute inset-0 rounded-full bg-accent/15 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
      ) : null}
      <svg
        viewBox="0 0 36 36"
        className="absolute inset-0 size-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={glowId} cx="32%" cy="28%" r="70%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop
              offset="100%"
              stopColor="var(--surface-elevated)"
              stopOpacity="1"
            />
          </radialGradient>
        </defs>
        <circle
          cx="18"
          cy="18"
          r="17"
          fill={`url(#${glowId})`}
          className="stroke-accent/35 transition-[stroke] duration-300 group-hover:stroke-accent/60"
          strokeWidth="1"
        />
        <circle
          cx="18"
          cy="18"
          r="12.25"
          className="stroke-accent/20"
          strokeWidth="1"
          strokeDasharray="2.2 2.8"
        />
      </svg>
      <span
        className="absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 font-mono font-bold leading-none text-accent"
        style={{ fontSize }}
      >
        ATL
      </span>
    </span>
  );
}
