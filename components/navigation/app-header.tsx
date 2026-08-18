"use client";

import { Bell, MessageCircle, Mic, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { MobileMenu } from "@/components/navigation/mobile-menu";
import { Avatar } from "@/components/ui/avatar";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function AppHeader({
  name,
  avatarUrl,
  unreadNotifications = 0,
  profile,
  roleName,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  unreadNotifications?: number;
  profile: {
    username?: string | null;
    fullName?: string | null;
    avatarUrl?: string | null;
  };
  roleName?: string | null;
}) {
  const t = useTranslations("app");
  const pathname = usePathname();
  const voiceActive = pathname.startsWith("/app/voice");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/80 bg-background/90 px-3 backdrop-blur-md sm:gap-3 lg:px-6">
      <MobileMenu profile={profile} roleName={roleName} />
      <form action="/app/search" className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          name="q"
          placeholder={t("searchPlaceholder")}
          className="h-10 w-full rounded-lg border border-border bg-surface-elevated ps-10 pe-3 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
      </form>
      <Link
        href="/app/voice"
        className={cn(
          "rounded-lg p-2 hover:bg-accent-muted hover:text-foreground lg:hidden",
          voiceActive ? "text-foreground" : "text-secondary",
        )}
        aria-label={t("nav.voice")}
      >
        <Mic className="size-5" strokeWidth={1.7} />
      </Link>
      <Link
        href="/app/notifications"
        className="relative rounded-lg p-2 text-secondary hover:bg-accent-muted hover:text-foreground"
        aria-label={t("nav.notifications")}
      >
        <Bell className="size-5" strokeWidth={1.7} />
        {unreadNotifications > 0 ? (
          <span className="absolute end-1 top-1 size-2 rounded-full bg-accent" />
        ) : null}
      </Link>
      <Link
        href="/app/messages"
        className="rounded-lg p-2 text-secondary hover:bg-accent-muted hover:text-foreground"
        aria-label={t("nav.messages")}
      >
        <MessageCircle className="size-5" strokeWidth={1.7} />
      </Link>
      <Link href="/app/settings" className="hidden sm:block">
        <Avatar name={name} src={avatarUrl} size="sm" />
      </Link>
    </header>
  );
}
