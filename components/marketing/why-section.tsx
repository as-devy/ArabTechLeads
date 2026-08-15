import {
  Code2,
  Handshake,
  Search,
  UsersRound,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  SectionHeader,
  SectionPanel,
  SectionShell,
  featureIconClass,
} from "@/components/marketing/section-frame";
import { cn } from "@/lib/utils";

const features = [
  { key: "share" as const, icon: Code2, index: "01" },
  { key: "discover" as const, icon: Search, index: "02" },
  { key: "communities" as const, icon: UsersRound, index: "03" },
  { key: "collaborate" as const, icon: Handshake, index: "04" },
];

export async function WhySection() {
  const t = await getTranslations("why");

  return (
    <SectionShell id="explore">
      <SectionHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <SectionPanel
        className={cn(
          "mt-14 grid sm:grid-cols-2",
          "divide-y divide-border/70 sm:divide-y-0",
        )}
      >
        {features.map(({ key, icon: Icon, index }, i) => (
          <article
            key={key}
            className={cn(
              "group relative p-7 sm:p-8 lg:p-9 fade-up",
              "transition-colors duration-300 hover:bg-accent-muted/40",
              i % 2 === 0 && "sm:border-e sm:border-border/70",
              i < 2 && "sm:border-b sm:border-border/70",
            )}
            style={{ animationDelay: `${140 + i * 100}ms` }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="flex items-start justify-between gap-4">
              <div className={featureIconClass}>
                <Icon className="size-5 sm:size-[1.35rem]" strokeWidth={1.7} />
              </div>
              <span className="font-mono text-xs tracking-[0.16em] text-muted transition-colors duration-300 group-hover:text-accent/80">
                {index}
              </span>
            </div>

            <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {t(`${key}.title`)}
            </h3>
            <p className="mt-2.5 max-w-sm text-sm leading-7 text-secondary sm:text-[0.95rem]">
              {t(`${key}.description`)}
            </p>

            <div className="mt-6 h-px w-8 bg-accent/35 transition-all duration-300 group-hover:w-14 group-hover:bg-accent" />
          </article>
        ))}
      </SectionPanel>
    </SectionShell>
  );
}
