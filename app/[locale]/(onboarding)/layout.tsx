import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function OnboardingLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="relative min-h-full">
      <div className="pointer-events-none absolute inset-0 hero-glow opacity-50" />
      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
        <BrandLogo />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
