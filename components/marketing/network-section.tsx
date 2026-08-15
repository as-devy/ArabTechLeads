import {
  GitBranch,
  HeartHandshake,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  SectionHeader,
  SectionPanel,
  SectionShell,
  featureIconClass,
} from "@/components/marketing/section-frame";
import { cn } from "@/lib/utils";

const stepMeta = [
  { key: "skills" as const, icon: Wrench, index: "01" },
  { key: "interests" as const, icon: Sparkles, index: "02" },
  { key: "communities" as const, icon: Users, index: "03" },
  { key: "developers" as const, icon: GitBranch, index: "04" },
  { key: "connections" as const, icon: HeartHandshake, index: "05" },
];

export async function NetworkSection() {
  const t = await getTranslations("network");

  return (
    <SectionShell>
      <SectionHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <SectionPanel className="mt-14">
        <ol className="grid divide-y divide-border/70 sm:grid-cols-5 sm:divide-x sm:divide-y-0 sm:rtl:divide-x-reverse">
          {stepMeta.map(({ key, icon: Icon, index }, i) => (
            <li
              key={key}
              className={cn(
                "group relative flex flex-col items-center p-6 text-center fade-up sm:p-5 lg:p-6",
                "transition-colors duration-300 hover:bg-accent-muted/40",
              )}
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:inset-y-0 sm:inset-x-auto sm:start-0 sm:w-px sm:bg-gradient-to-b" />

              <span className="mb-4 font-mono text-[10px] tracking-[0.18em] text-muted transition-colors duration-300 group-hover:text-accent/80">
                {index}
              </span>
              <div className={cn(featureIconClass, "size-11")}>
                <Icon className="size-5" strokeWidth={1.7} />
              </div>
              <p className="mt-5 text-sm font-semibold tracking-tight text-foreground sm:text-[0.95rem]">
                {t(key)}
              </p>
              <div className="mt-4 h-px w-7 bg-accent/35 transition-all duration-300 group-hover:w-11 group-hover:bg-accent" />
            </li>
          ))}
        </ol>
      </SectionPanel>
    </SectionShell>
  );
}
