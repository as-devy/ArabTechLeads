"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(next: Locale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-surface-elevated p-0.5 text-xs",
        className,
      )}
      role="group"
      aria-label={t("language")}
    >
      <button
        type="button"
        onClick={() => switchLocale("ar")}
        className={cn(
          "rounded-[5px] px-2.5 py-1.5 transition-colors",
          locale === "ar"
            ? "bg-accent-muted text-foreground"
            : "text-muted hover:text-foreground",
        )}
        aria-pressed={locale === "ar"}
      >
        العربية
      </button>
      <button
        type="button"
        onClick={() => switchLocale("en")}
        className={cn(
          "rounded-[5px] px-2.5 py-1.5 transition-colors",
          locale === "en"
            ? "bg-accent-muted text-foreground"
            : "text-muted hover:text-foreground",
        )}
        aria-pressed={locale === "en"}
      >
        English
      </button>
    </div>
  );
}
