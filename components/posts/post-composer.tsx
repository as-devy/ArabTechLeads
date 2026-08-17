"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CODE_LANGUAGES } from "@/lib/format";
import { createPostAction } from "@/lib/actions/posts";
import { Button } from "@/components/ui/button";
import { communitySurfaceStyle } from "@/lib/communities/theme";
import { cn } from "@/lib/utils";

export function PostComposer({
  communityId,
  accent,
}: {
  communityId?: string;
  accent?: string;
}) {
  const t = useTranslations("app.feed");
  const [mode, setMode] = useState<"text" | "code">("text");
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    await createPostAction(formData);
    setPending(false);
    (document.getElementById("compose") as HTMLFormElement | null)?.reset();
  }

  return (
    <form
      id="compose"
      action={onSubmit}
      className={cn(
        "rounded-xl border border-border bg-surface p-4",
        accent && "border-s-[3px] bg-[var(--community-soft)]",
      )}
      style={accent ? communitySurfaceStyle(accent) : undefined}
    >
      {communityId ? (
        <input type="hidden" name="communityId" value={communityId} />
      ) : null}
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`rounded-md px-3 py-1.5 text-sm ${mode === "text" ? "bg-accent-muted text-foreground" : "text-secondary"}`}
        >
          {t("text")}
        </button>
        <button
          type="button"
          onClick={() => setMode("code")}
          className={`rounded-md px-3 py-1.5 text-sm ${mode === "code" ? "bg-accent-muted text-foreground" : "text-secondary"}`}
        >
          {t("code")}
        </button>
      </div>
      <textarea
        name="content"
        rows={3}
        placeholder={t("composer")}
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted"
      />
      {mode === "code" ? (
        <div className="mt-3 space-y-2">
          <select
            name="language"
            className="h-9 rounded-md border border-border bg-background px-2 text-sm dir-ltr"
            defaultValue="TypeScript"
          >
            {CODE_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <textarea
            name="code"
            rows={8}
            dir="ltr"
            className="dir-ltr w-full rounded-lg border border-code-border bg-code-bg p-3 font-mono text-[13px] outline-none"
            placeholder="const result = await prisma.profile.findMany()"
          />
        </div>
      ) : null}
      <div className="mt-3 flex justify-end">
        <Button
          type="submit"
          disabled={pending}
          className="h-9 px-4 text-sm"
          style={accent ? { background: "var(--community)", color: "#fff" } : undefined}
        >
          {t("publish")}
        </Button>
      </div>
    </form>
  );
}
