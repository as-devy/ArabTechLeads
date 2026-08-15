import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function HeroSection() {
  const t = await getTranslations("hero");

  return (
    <section
      id="home"
      className="relative overflow-hidden border-b border-border-subtle"
    >
      <div className="pointer-events-none absolute inset-0 hero-glow" />
      <div className="pointer-events-none absolute inset-0 surface-grid opacity-40" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:px-8 lg:py-24">
        <div className="fade-up max-w-xl">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="text-sm font-semibold tracking-[-0.03em] text-foreground">
              Arab
              <span className="text-muted">Tech</span>
              <span className="text-accent">Leads</span>
            </span>
            <span className="h-px w-3 bg-accent/45" />
            <span className="font-mono text-[10px] font-medium tracking-[0.2em] text-muted uppercase">
              Network
            </span>
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-[1.2] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
            {t("headline")}
          </h1>
          <p className="mt-4 text-xl font-medium text-secondary sm:text-2xl">
            {t("tagline")}
          </p>
          <p className="mt-5 max-w-lg text-base leading-8 text-secondary sm:text-[1.05rem]">
            {t("description")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }), "sm:min-w-44")}
            >
              {t("ctaPrimary")}
            </Link>
            <a
              href="#developers"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "sm:min-w-44",
              )}
            >
              {t("ctaSecondary")}
            </a>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
