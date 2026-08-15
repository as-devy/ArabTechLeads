"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "#home", key: "home" as const },
  { href: "#explore", key: "explore" as const },
  { href: "#developers", key: "developers" as const },
  { href: "#communities", key: "communities" as const },
];

export function MarketingNavbar() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled || open
          ? "border-border/80 bg-background/80 backdrop-blur-xl"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandLogo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm text-secondary transition-colors hover:bg-accent-muted hover:text-foreground"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            {t("login")}
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
          >
            {t("join")}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-surface-elevated text-foreground md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "border-t border-border bg-background/95 backdrop-blur-xl md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="rounded-md px-3 py-3 text-sm text-secondary hover:bg-accent-muted hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {t(link.key)}
            </a>
          ))}
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-4">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <div className="mt-3 grid gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full")}
              onClick={() => setOpen(false)}
            >
              {t("login")}
            </Link>
            <Link
              href="/register"
              className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}
              onClick={() => setOpen(false)}
            >
              {t("join")}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
