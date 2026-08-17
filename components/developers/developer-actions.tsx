"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleFollowAction, requestConnectionAction } from "@/lib/actions/social";
import { Link } from "@/i18n/navigation";

export function DeveloperActions({
  profileId,
  username,
  isFollowing,
  isSelf,
}: {
  profileId: string;
  username?: string | null;
  isFollowing: boolean;
  isSelf?: boolean;
}) {
  const t = useTranslations("app.developers");
  const [pending, start] = useTransition();
  if (isSelf) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => toggleFollowAction(profileId))}
        className="h-8 rounded-md border border-border px-3 text-xs hover:bg-accent-muted"
      >
        {isFollowing ? t("unfollow") : t("follow")}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => requestConnectionAction(profileId))}
        className="h-8 rounded-md border border-border px-3 text-xs hover:bg-accent-muted"
      >
        {t("connect")}
      </button>
      {username ? (
        <Link
          href={`/app/developers/${username}` as never}
          className="inline-flex h-8 items-center rounded-md bg-accent px-3 text-xs text-white"
        >
          {t("view")}
        </Link>
      ) : null}
    </div>
  );
}
