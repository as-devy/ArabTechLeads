import type { ReactNode } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PlatformLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app");

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandLogo href="/app" />
          <nav className="hidden items-center gap-1 text-sm text-secondary sm:flex">
            <span className="rounded-md bg-accent-muted px-3 py-1.5 text-foreground">
              {t("navHome")}
            </span>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
