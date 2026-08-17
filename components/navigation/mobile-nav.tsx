"use client";

import { Compass, Home, Plus, UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function MobileNav({ username }: { username?: string | null }) {
  const t = useTranslations("app.nav");
  const pathname = usePathname();

  const items = [
    { href: "/app", key: "home" as const, icon: Home },
    { href: "/app/explore", key: "explore" as const, icon: Compass },
    { href: "/app#compose", key: "publish" as const, icon: Plus, center: true },
    { href: "/app/network", key: "network" as const, icon: Users },
    {
      href: username ? `/app/developers/${username}` : "/app/settings",
      key: "profile" as const,
      icon: UserRound,
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          return (
            <li key={item.key}>
              <Link
                href={item.href as never}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[10px]",
                  item.center && "relative -mt-4",
                  active ? "text-foreground" : "text-muted",
                )}
              >
                <span
                  className={cn(
                    item.center &&
                      "flex size-12 items-center justify-center rounded-full bg-accent text-white shadow-md",
                  )}
                >
                  <Icon className={cn("size-5", item.center && "size-5")} />
                </span>
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
