"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type Profile = {
  username?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
};

export function UserMenu({
  profile,
  roleName,
  onNavigate,
}: {
  profile: Profile;
  roleName?: string | null;
  onNavigate?: () => void;
}) {
  const t = useTranslations("app.userMenu");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative mt-auto border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-start transition-colors",
          "hover:border-border hover:bg-surface",
          open && "border-border bg-surface",
        )}
      >
        <Avatar
          name={profile.fullName}
          src={profile.avatarUrl}
          size="md"
          className="ring-2 ring-border/80"
        />
        <span className="min-w-0 flex-1 text-start">
          <span className="block truncate text-sm font-semibold leading-5">
            {profile.fullName}
          </span>
          <span className="mt-0.5 block truncate text-xs leading-4 text-muted">
            <span dir="ltr" className="inline-block">
              @{profile.username}
            </span>
          </span>
          {roleName ? (
            <span className="mt-1 inline-block max-w-full truncate rounded-md bg-accent-muted px-1.5 py-0.5 text-[11px] leading-4 text-secondary">
              {roleName}
            </span>
          ) : null}
        </span>
        <ChevronUp
          className={cn(
            "size-4 shrink-0 text-muted transition-transform",
            open ? "rotate-0" : "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="absolute inset-x-0 bottom-full z-20 mb-2 overflow-hidden rounded-xl border border-border bg-surface shadow-md">
          <Link
            href={
              profile.username
                ? (`/app/developers/${profile.username}` as never)
                : "/app/settings"
            }
            className="block px-3 py-2.5 text-sm hover:bg-accent-muted"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
          >
            {t("viewProfile")}
          </Link>
          <Link
            href="/app/settings"
            className="block px-3 py-2.5 text-sm hover:bg-accent-muted"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
          >
            {t("settings")}
          </Link>
          <form action={signOutAction} className="border-t border-border">
            <button
              type="submit"
              className="w-full px-3 py-2.5 text-start text-sm text-error hover:bg-accent-muted"
            >
              {t("signOut")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
