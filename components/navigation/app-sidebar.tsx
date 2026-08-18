"use client";

import {
  Bell,
  Bookmark,
  Compass,
  FolderKanban,
  GitBranch,
  Home,
  LineChart,
  MessageCircle,
  Mic,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/brand/brand-logo";
import { OpportunitiesNav } from "@/components/navigation/opportunities-nav";
import { UserMenu } from "@/components/navigation/user-menu";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const top = [
  { href: "/app", key: "home" as const, icon: Home },
  { href: "/app/explore", key: "explore" as const, icon: Compass },
  { href: "/app/developers", key: "developers" as const, icon: Users },
  { href: "/app/projects", key: "projects" as const, icon: FolderKanban },
  { href: "/app/open-source", key: "openSource" as const, icon: GitBranch },
];

const bottom = [
  { href: "/app/network", key: "network" as const, icon: UsersRound },
  { href: "/app/communities", key: "communities" as const, icon: Users },
  { href: "/app/voice", key: "voice" as const, icon: Mic },
  { href: "/app/saved", key: "saved" as const, icon: Bookmark },
];

export type AppNavProfile = {
  username?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
};

function NavLink({
  href,
  icon: Icon,
  label,
  pathname,
  onNavigate,
}: {
  href: string;
  icon: typeof Home;
  label: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
  return (
    <Link
      href={href as "/app"}
      onClick={onNavigate}
      className={cn(
        "inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-accent-muted font-medium text-foreground"
          : "text-secondary hover:bg-accent-muted/50 hover:text-foreground",
      )}
    >
      <Icon className="size-4" strokeWidth={1.8} />
      {label}
    </Link>
  );
}

export function AppNav({
  profile,
  onNavigate,
}: {
  profile: AppNavProfile;
  onNavigate?: () => void;
}) {
  const t = useTranslations("app.nav");
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
      {top.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={t(item.key)}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
      <OpportunitiesNav onNavigate={onNavigate} />
      {bottom.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={t(item.key)}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
      <div className="my-3 h-px bg-border" />
      <Link
        href={
          profile.username
            ? (`/app/developers/${profile.username}` as never)
            : "/app/settings"
        }
        onClick={onNavigate}
        className="inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-secondary hover:bg-accent-muted/50 hover:text-foreground"
      >
        <UserRound className="size-4" strokeWidth={1.8} />
        {t("profile")}
      </Link>
      <Link
        href="/app/notifications"
        onClick={onNavigate}
        className="inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-secondary hover:bg-accent-muted/50 hover:text-foreground"
      >
        <Bell className="size-4" strokeWidth={1.8} />
        {t("notifications")}
      </Link>
      <Link
        href="/app/messages"
        onClick={onNavigate}
        className="inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-secondary hover:bg-accent-muted/50 hover:text-foreground"
      >
        <MessageCircle className="size-4" strokeWidth={1.8} />
        {t("messages")}
      </Link>
      <Link
        href="/app/analytics"
        onClick={onNavigate}
        className="inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-secondary hover:bg-accent-muted/50 hover:text-foreground"
      >
        <LineChart className="size-4" strokeWidth={1.8} />
        {t("analytics")}
      </Link>
      <Link
        href="/app/verification"
        onClick={onNavigate}
        className="inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-secondary hover:bg-accent-muted/50 hover:text-foreground"
      >
        <ShieldCheck className="size-4" strokeWidth={1.8} />
        {t("verification")}
      </Link>
      <Link
        href="/app/settings"
        onClick={onNavigate}
        className="inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-secondary hover:bg-accent-muted/50 hover:text-foreground"
      >
        <Settings className="size-4" strokeWidth={1.8} />
        {t("settings")}
      </Link>
    </nav>
  );
}

export function AppSidebar({
  profile,
  roleName,
}: {
  profile: AppNavProfile;
  roleName?: string | null;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-border/80 bg-background px-3 py-4 lg:flex">
      <div className="px-2 pb-5">
        <BrandLogo href="/app" />
      </div>
      <AppNav profile={profile} />
      <UserMenu profile={profile} roleName={roleName} />
    </aside>
  );
}
