"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  blockUserAction,
  endorseSkillAction,
  writeRecommendationAction,
} from "@/lib/actions/stage5";
import { Button } from "@/components/ui/button";

export function TrustActions({
  recipientId,
  skills,
}: {
  recipientId: string;
  skills: { id: string; name: string }[];
}) {
  const t = useTranslations("app.stage5");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <form
        className="flex flex-wrap gap-2"
        action={(fd) => {
          start(() => {
            void endorseSkillAction(recipientId, String(fd.get("skillId")));
          });
        }}
      >
        <select name="skillId" className="h-10 rounded-md border border-border bg-background px-2 text-sm">
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={pending || skills.length === 0}>
          {t("endorse")}
        </Button>
      </form>
      <form
        className="space-y-2"
        action={(fd) => {
          start(() => {
            void writeRecommendationAction(recipientId, fd);
          });
        }}
      >
        <textarea
          name="body"
          required
          minLength={20}
          rows={3}
          placeholder={t("recommendationPlaceholder")}
          className="w-full rounded-md border border-border bg-background p-3 text-sm"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {t("recommend")}
        </Button>
      </form>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => start(() => blockUserAction(recipientId))}
      >
        {t("block")}
      </Button>
    </div>
  );
}
