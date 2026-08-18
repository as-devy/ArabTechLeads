"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/brand/brand-logo";
import { AppNav, type AppNavProfile } from "@/components/navigation/app-sidebar";
import { UserMenu } from "@/components/navigation/user-menu";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function MobileMenu({
  profile,
  roleName,
}: {
  profile: AppNavProfile;
  roleName?: string | null;
}) {
  const t = useTranslations("app.nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  const drawer = (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label={t("closeMenu")}
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={close}
      />
      <aside
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label={t("menu")}
        className={cn(
          "absolute inset-y-0 start-0 flex h-dvh w-[min(20rem,88vw)] flex-col border-e border-border bg-background px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg transition-transform duration-200",
          open ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full",
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3 px-2" onClick={close}>
          <BrandLogo href="/app" />
          <button
            type="button"
            className="rounded-lg p-2 text-secondary hover:bg-accent-muted hover:text-foreground"
            aria-label={t("closeMenu")}
            onClick={(event) => {
              event.stopPropagation();
              close();
            }}
          >
            <X className="size-5" strokeWidth={1.7} />
          </button>
        </div>
        <AppNav profile={profile} onNavigate={close} />
        <UserMenu profile={profile} roleName={roleName} onNavigate={close} />
      </aside>
    </div>
  );

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="rounded-lg p-2 text-secondary hover:bg-accent-muted hover:text-foreground"
        aria-label={t("menu")}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" strokeWidth={1.7} />
      </button>
      {mounted ? createPortal(drawer, document.body) : null}
    </div>
  );
}
