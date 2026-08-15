import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  SectionHeader,
  SectionPanel,
  SectionShell,
} from "@/components/marketing/section-frame";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function FinalCtaSection() {
  const t = await getTranslations("finalCta");

  return (
    <SectionShell>
      <SectionPanel className="relative px-6 py-14 text-center sm:px-10 sm:py-16 lg:px-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_65%)]" />
        <div className="relative">
          <SectionHeader
            eyebrow={t("eyebrow")}
            title={t("title")}
            subtitle={t("subtitle")}
          />
          <div className="mt-8 fade-up" style={{ animationDelay: "160ms" }}>
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }), "min-w-56")}
            >
              {t("action")}
            </Link>
          </div>
          <div className="mx-auto mt-8 h-px w-16 bg-accent/40" />
        </div>
      </SectionPanel>
    </SectionShell>
  );
}
