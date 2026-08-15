import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ShellProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  muted?: boolean;
};

export function SectionShell({ id, children, className, muted = false }: ShellProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative overflow-hidden border-b border-border-subtle py-20 sm:py-28",
        muted && "bg-surface/30",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 surface-grid opacity-30" />
      <div className="pointer-events-none absolute inset-0 hero-glow opacity-35" />
      <div className="pointer-events-none absolute -start-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -end-20 bottom-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}

type HeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "start";
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: HeaderProps) {
  return (
    <div
      className={cn(
        "fade-up",
        align === "center" && "mx-auto max-w-2xl text-center",
        align === "start" && "max-w-xl text-start",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 inline-flex items-center gap-2",
          align === "center" && "justify-center",
        )}
      >
        <span className="h-px w-4 bg-accent/50" />
        <span className="font-mono text-[11px] font-medium tracking-[0.2em] text-accent uppercase">
          {eyebrow}
        </span>
        <span className="h-px w-4 bg-accent/50" />
      </div>
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "mt-4 text-base leading-7 text-secondary sm:text-[1.05rem]",
            align === "center" && "mx-auto max-w-xl",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function SectionPanel({ children, className }: PanelProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-surface-elevated/40 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const featureIconClass =
  "relative inline-flex size-12 items-center justify-center rounded-lg border border-accent/25 bg-[radial-gradient(circle_at_30%_25%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_65%)] text-accent shadow-[inset_0_1px_0_color-mix(in_oklab,white_8%,transparent)] transition-transform duration-300 group-hover:scale-[1.04]";
