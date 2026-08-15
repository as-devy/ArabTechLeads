import {
  Boxes,
  BrainCircuit,
  Cloud,
  Code2,
  Lock,
  Palette,
  Server,
  Terminal,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  SectionHeader,
  SectionPanel,
  SectionShell,
  featureIconClass,
} from "@/components/marketing/section-frame";
import { cn } from "@/lib/utils";

const communities = [
  { key: "react" as const, icon: Code2, members: 1240, index: "01" },
  { key: "nextjs" as const, icon: Boxes, members: 980, index: "02" },
  { key: "backend" as const, icon: Server, members: 1120, index: "03" },
  { key: "security" as const, icon: Lock, members: 760, index: "04" },
  { key: "ai" as const, icon: BrainCircuit, members: 890, index: "05" },
  { key: "devops" as const, icon: Cloud, members: 640, index: "06" },
  { key: "uiux" as const, icon: Palette, members: 520, index: "07" },
  { key: "opensource" as const, icon: Terminal, members: 710, index: "08" },
];

export async function CommunitiesSection() {
  const t = await getTranslations("communities");

  return (
    <SectionShell id="communities" muted>
      <SectionHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <SectionPanel
        className={cn(
          "mt-14 grid sm:grid-cols-2 lg:grid-cols-4",
          "divide-y divide-border/70 sm:divide-y-0",
        )}
      >
        {communities.map(({ key, icon: Icon, members, index }, i) => (
          <article
            key={key}
            className={cn(
              "group relative p-5 sm:p-6 fade-up",
              "transition-colors duration-300 hover:bg-accent-muted/40",
              "sm:border-e sm:border-border/70",
              "sm:[&:nth-child(2n)]:border-e-0 lg:[&:nth-child(2n)]:border-e",
              "lg:[&:nth-child(4n)]:border-e-0",
              i < 4 && "lg:border-b lg:border-border/70",
              i < 6 && "sm:border-b sm:border-border/70 lg:[&:nth-child(n+5)]:border-b-0",
            )}
            style={{ animationDelay: `${100 + i * 70}ms` }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="flex items-start justify-between gap-3">
              <div className={cn(featureIconClass, "size-11")}>
                <Icon className="size-5" strokeWidth={1.7} />
              </div>
              <span className="font-mono text-[10px] tracking-[0.16em] text-muted transition-colors duration-300 group-hover:text-accent/80">
                {index}
              </span>
            </div>

            <h3 className="mt-5 font-semibold tracking-tight text-foreground">
              {t(`items.${key}.name`)}
            </h3>
            <p className="mt-2 text-sm leading-6 text-secondary">
              {t(`items.${key}.description`)}
            </p>
            <p className="mt-4 font-mono text-[11px] tracking-wide text-muted">
              {t("members", { count: members.toLocaleString() })}
            </p>
            <div className="mt-4 h-px w-7 bg-accent/35 transition-all duration-300 group-hover:w-11 group-hover:bg-accent" />
          </article>
        ))}
      </SectionPanel>
    </SectionShell>
  );
}
