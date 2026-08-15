import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { AuthInteractiveBackground } from "@/components/auth/auth-interactive-background";
import { AuthNetworkScene } from "@/components/auth/auth-network-scene";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export async function AuthShell({ title, subtitle, children }: Props) {
  const brand = await getTranslations("brand");
  const t = await getTranslations("auth");

  return (
    <div className="relative flex min-h-dvh flex-col">
      <AuthInteractiveBackground />

      <header className="relative z-20 shrink-0">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          <section className="mx-auto w-full max-w-[400px] lg:mx-0 lg:justify-self-center">
            <div className="mb-7">
              <p className="text-xs font-medium tracking-[0.08em] text-accent uppercase">
                {brand("motto")}
              </p>
              <h1 className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
                {title}
              </h1>
              <p className="mt-2.5 text-sm leading-6 text-secondary">{subtitle}</p>
            </div>

            <div className="rounded-lg border border-border/70 bg-surface-elevated/70 p-5 shadow-sm backdrop-blur-sm sm:p-6">
              {children}
            </div>

            <p className="mt-5 text-center text-[11px] leading-5 text-muted">
              {t("secureNote")}
            </p>
          </section>

          <section className="mx-auto flex w-full max-w-[640px] items-center justify-center lg:justify-self-center">
            <AuthNetworkScene />
          </section>
        </div>
      </main>
    </div>
  );
}
