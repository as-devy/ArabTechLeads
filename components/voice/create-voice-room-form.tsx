"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createVoiceRoomAction } from "@/lib/actions/voice";
import type { VoiceErrorCode, VoiceRoomType, VoiceVisibility } from "@/lib/voice/types";

type Option = { id: string; label: string };

export function CreateVoiceRoomForm({
  communities,
  projects,
  events,
  initialType,
  initialCommunityId,
  initialProjectId,
  initialEventId,
}: {
  communities: Option[];
  projects: Option[];
  events: Option[];
  initialType?: VoiceRoomType;
  initialCommunityId?: string;
  initialProjectId?: string;
  initialEventId?: string;
}) {
  const t = useTranslations("app.voice");
  const [type, setType] = useState<VoiceRoomType>(initialType ?? "PUBLIC");
  const [visibility, setVisibility] = useState<VoiceVisibility>(
    initialType === "PRIVATE" ? "PRIVATE" : "PUBLIC",
  );
  const [schedule, setSchedule] = useState<"now" | "later">("now");
  const [error, setError] = useState<VoiceErrorCode | null>(null);
  const [pending, setPending] = useState(false);

  const parentOptions = useMemo(() => {
    if (type === "COMMUNITY") return communities;
    if (type === "PROJECT") return projects;
    if (type === "EVENT") return events;
    return [];
  }, [type, communities, projects, events]);

  return (
    <form
      className="max-w-xl space-y-4"
      action={async (fd) => {
        setPending(true);
        setError(null);
        const result = await createVoiceRoomAction(fd);
        if (result && "error" in result && result.error) setError(result.error);
        setPending(false);
      }}
    >
      <Input name="name" label={t("name")} required minLength={3} maxLength={80} />
      <label className="block space-y-1.5">
        <span className="block text-sm font-medium">{t("description")}</span>
        <textarea
          name="description"
          rows={4}
          className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm outline-none focus-visible:border-accent"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="block text-sm font-medium">{t("type")}</span>
        <select
          name="type"
          value={type}
          onChange={(e) => {
            const next = e.target.value as VoiceRoomType;
            setType(next);
            if (next === "PRIVATE") setVisibility("PRIVATE");
          }}
          className="h-11 w-full rounded-md border border-border bg-surface-elevated px-3 text-sm"
        >
          {(["COMMUNITY", "PROJECT", "EVENT", "PUBLIC", "PRIVATE"] as const).map((value) => (
            <option key={value} value={value}>
              {t(`types.${value}`)}
            </option>
          ))}
        </select>
      </label>
      {parentOptions.length > 0 ? (
        <label className="block space-y-1.5">
          <span className="block text-sm font-medium">{t(`parent.${type}`)}</span>
          <select
            name={type === "COMMUNITY" ? "communityId" : type === "PROJECT" ? "projectId" : "eventId"}
            required
            defaultValue={initialCommunityId || initialProjectId || initialEventId || ""}
            className="h-11 w-full rounded-md border border-border bg-surface-elevated px-3 text-sm"
          >
            <option value="">{t("selectParent")}</option>
            {parentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {type !== "PRIVATE" ? (
        <label className="block space-y-1.5">
          <span className="block text-sm font-medium">{t("visibility")}</span>
          <select
            name="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as VoiceVisibility)}
            className="h-11 w-full rounded-md border border-border bg-surface-elevated px-3 text-sm"
          >
            {(["PUBLIC", "COMMUNITY", "MEMBERS", "PRIVATE"] as const).map((value) => (
              <option key={value} value={value}>
                {t(`visibilityOptions.${value}`)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="visibility" value="PRIVATE" />
      )}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("schedule")}</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="schedule"
            value="now"
            checked={schedule === "now"}
            onChange={() => setSchedule("now")}
          />
          {t("scheduleNow")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="schedule"
            value="later"
            checked={schedule === "later"}
            onChange={() => setSchedule("later")}
          />
          {t("scheduleLater")}
        </label>
        {schedule === "later" ? (
          <input
            type="datetime-local"
            name="scheduledAt"
            required
            className="h-11 w-full rounded-md border border-border bg-surface-elevated px-3 text-sm dir-ltr"
          />
        ) : null}
      </fieldset>
      <Input
        name="maxParticipants"
        type="number"
        min={2}
        max={100}
        defaultValue={25}
        label={t("maxParticipants")}
      />
      {error ? <p className="text-sm text-error">{t(`errors.${error}`)}</p> : null}
      <Button type="submit" disabled={pending}>
        {t("create")}
      </Button>
    </form>
  );
}
