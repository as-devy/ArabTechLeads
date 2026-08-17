"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CommunityAvatar, CommunityBanner } from "@/components/communities/community-identity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCommunityAction } from "@/lib/actions/communities";
import { COMMUNITY_PALETTE, normalizeHex } from "@/lib/communities/theme";
import { slugify } from "@/lib/constants/taxonomy";
import { cn } from "@/lib/utils";

export function CreateCommunityForm() {
  const t = useTranslations("app.communities");
  const [name, setName] = useState("");
  const [themeColor, setThemeColor] = useState<string>(COMMUNITY_PALETTE[0]);
  const [imageUrl, setImageUrl] = useState("");
  const slug = slugify(name) || "group";
  const preview = {
    slug,
    name: name || t("previewName"),
    themeColor: normalizeHex(themeColor),
    imageUrl: imageUrl.startsWith("https://") ? imageUrl : null,
  };

  return (
    <form action={createCommunityAction} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <Input
          name="name"
          label={t("name")}
          required
          minLength={3}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="block space-y-1.5">
          <span className="block text-sm font-medium">{t("description")}</span>
          <textarea
            name="description"
            rows={4}
            className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm outline-none focus-visible:border-accent"
          />
        </label>
        <Input
          name="imageUrl"
          label={t("image")}
          hint={t("imageHint")}
          dir="ltr"
          className="text-start"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://"
        />
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t("theme")}</legend>
          <input type="hidden" name="themeColor" value={themeColor} />
          <div className="flex flex-wrap items-center gap-2">
            {COMMUNITY_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setThemeColor(color)}
                className={cn(
                  "size-8 rounded-full border-2 transition-transform",
                  themeColor === color ? "scale-110 border-foreground" : "border-transparent",
                )}
                style={{ background: color }}
                aria-label={color}
              />
            ))}
            <label className="ms-1 inline-flex items-center gap-2 text-xs text-muted">
              <input
                type="color"
                value={normalizeHex(themeColor)}
                onChange={(e) => setThemeColor(e.target.value)}
                className="size-8 cursor-pointer rounded-md border border-border bg-transparent"
                aria-label={t("theme")}
              />
            </label>
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isOpen" defaultChecked className="size-4 accent-current" />
          {t("isOpen")}
        </label>
        <Button type="submit">{t("create")}</Button>
      </div>
      <aside className="overflow-hidden rounded-xl border border-border">
        <CommunityBanner community={preview} compact />
        <div className="px-4 pb-4">
          <div className="-mt-8">
            <CommunityAvatar community={preview} size="lg" />
          </div>
          <p className="mt-3 text-xs text-muted">{t("preview")}</p>
          <p className="mt-1 font-medium">{preview.name}</p>
        </div>
      </aside>
    </form>
  );
}
