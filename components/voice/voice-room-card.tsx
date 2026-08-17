"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { VoiceRoomCardData } from "@/lib/voice/types";
import { cn } from "@/lib/utils";

export function VoiceRoomCard({
  room,
  locale,
  parentLabel,
}: {
  room: VoiceRoomCardData;
  locale: string;
  parentLabel?: string;
}) {
  const t = useTranslations("app.voice");
  const live = room.status === "LIVE";
  const when = room.scheduledAt
    ? new Intl.DateTimeFormat(locale.startsWith("ar") ? "ar" : "en", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(room.scheduledAt))
    : null;

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-[11px] font-semibold tracking-wide",
            live ? "text-error" : room.status === "ENDED" ? "text-muted" : "text-accent",
          )}
        >
          {live ? `● ${t("live")}` : room.status === "ENDED" ? t("ended") : t("upcoming")}
        </p>
        {room.locked ? <span className="text-[11px] text-muted">{t("locked")}</span> : null}
      </div>
      <h3 className="mt-2 text-base font-semibold">{room.name}</h3>
      {room.description ? (
        <p className="mt-1 line-clamp-2 text-sm text-secondary">{room.description}</p>
      ) : null}
      <p className="mt-3 text-xs text-muted">
        {t("hostedBy")} {room.createdBy.fullName}
        {parentLabel ? ` · ${parentLabel}` : null}
      </p>
      {when && room.status === "SCHEDULED" ? (
        <p className="mt-1 text-xs text-secondary">{when}</p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 space-x-reverse">
            {room.previews.map((p) => (
              <Avatar key={p.id} name={p.fullName} src={p.avatarUrl} size="sm" className="ring-2 ring-surface" />
            ))}
          </div>
          <span className="text-xs text-muted">
            {t("participants", { count: room.participantCount })}
          </span>
        </div>
        <Link href={`/app/voice/${room.id}` as never}>
          <Button size="sm" variant={live ? "primary" : "secondary"}>
            {live ? t("join") : room.status === "ENDED" ? t("view") : t("open")}
          </Button>
        </Link>
      </div>
    </article>
  );
}
