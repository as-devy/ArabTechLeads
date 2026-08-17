"use client";

import { useState } from "react";
import { Briefcase, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app/opportunities", key: "hub" as const },
  { href: "/app/jobs", key: "jobs" as const },
  { href: "/app/freelance", key: "freelance" as const },
  { href: "/app/mentorship", key: "mentorship" as const },
  { href: "/app/events", key: "events" as const },
  { href: "/app/hackathons", key: "hackathons" as const },
];

export function OpportunitiesNav() {
  const t = useTranslations("app.nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(
    pathname.startsWith("/app/opportunities") ||
      pathname.startsWith("/app/jobs") ||
      pathname.startsWith("/app/freelance") ||
      pathname.startsWith("/app/mentorship") ||
      pathname.startsWith("/app/events") ||
      pathname.startsWith("/app/hackathons") ||
      pathname.startsWith("/app/companies") ||
      pathname.startsWith("/app/employer"),
  );
  const active = open;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
          active
            ? "bg-accent-muted font-medium text-foreground"
            : "text-secondary hover:bg-accent-muted/50 hover:text-foreground",
        )}
      >
        <Briefcase className="size-4" strokeWidth={1.8} />
        <span className="flex-1 text-start">{t("opportunities")}</span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <ul className="ms-6 mt-1 space-y-0.5 border-s border-border ps-3">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href as never}
                className={cn(
                  "block rounded-md px-2 py-1.5 text-sm",
                  pathname === item.href ||
                    (item.href !== "/app/opportunities" && pathname.startsWith(item.href))
                    ? "text-foreground"
                    : "text-secondary hover:text-foreground",
                )}
              >
                {t(item.key)}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
