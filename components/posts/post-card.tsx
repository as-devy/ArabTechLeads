"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { Bookmark, Ellipsis, Heart, MessageCircle, Share2, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { CodeBlock } from "@/components/code/code-block";
import { Link } from "@/i18n/navigation";
import { formatRelativeTime } from "@/lib/format";
import {
  addCommentAction,
  deleteCommentAction,
  deletePostAction,
  toggleLikeAction,
  toggleSaveAction,
} from "@/lib/actions/posts";
import { hideFeedPostAction, notInterestedAction, recordFeedInteractionAction } from "@/lib/actions/feed";
import { muteEntityAction } from "@/lib/actions/stage5";
import { communitySurfaceStyle, resolveThemeColor } from "@/lib/communities/theme";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/lib/posts/feed";

export type { FeedPost };

export function PostCard({
  post,
  currentUserId,
  onDismiss,
}: {
  post: FeedPost;
  currentUserId: string;
  onDismiss?: (postId: string) => void;
}) {
  const t = useTranslations("app.feed");
  const locale = useLocale();
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [, startTransition] = useTransition();
  const commentFormRef = useRef<HTMLFormElement>(null);
  const [liked, setLiked] = useOptimistic(post.liked);
  const [likeCount, setLikeCount] = useOptimistic(post._count.likes);
  const [saved, setSaved] = useOptimistic(post.saved);

  const role =
    locale === "ar" ? post.author.role?.nameAr : post.author.role?.nameEn;

  const theme = post.community
    ? communitySurfaceStyle(resolveThemeColor(post.community.slug, post.community.themeColor))
    : undefined;

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-surface p-4",
        post.community && "border-s-[3px] bg-[var(--community-soft)]",
      )}
      style={theme}
    >
      <div className="flex gap-3">
        <Link href={`/app/developers/${post.author.username}` as never}>
          <Avatar name={post.author.fullName} src={post.author.avatarUrl} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                href={`/app/developers/${post.author.username}` as never}
                className="font-medium hover:underline"
              >
                {post.author.fullName}
              </Link>
              <p className="text-xs text-muted">
                <span className="dir-ltr">@{post.author.username}</span>
                {role ? ` · ${role}` : ""}
                {" · "}
                {formatRelativeTime(new Date(post.createdAt), locale)}
              </p>
            </div>
            {post.authorId === currentUserId ? (
              <button
                type="button"
                className="rounded-md p-1 text-muted hover:text-error"
                onClick={() => {
                  startTransition(() => deletePostAction(post.id));
                }}
                aria-label={t("delete")}
              >
                <Trash2 className="size-4" />
              </button>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  className="rounded-md p-1 text-muted hover:text-foreground"
                  aria-label={t("more")}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <Ellipsis className="size-4" />
                </button>
                {menuOpen ? (
                  <div className="absolute end-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-surface shadow-md">
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-start text-xs hover:bg-accent-muted"
                      onClick={() => {
                        setMenuOpen(false);
                        onDismiss?.(post.id);
                        startTransition(() => void notInterestedAction(post.id));
                      }}
                    >
                      {t("notInterested")}
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-start text-xs hover:bg-accent-muted"
                      onClick={() => {
                        setMenuOpen(false);
                        onDismiss?.(post.id);
                        startTransition(() => void hideFeedPostAction(post.id));
                      }}
                    >
                      {t("hide")}
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-start text-xs hover:bg-accent-muted"
                      onClick={() => {
                        setMenuOpen(false);
                        onDismiss?.(post.id);
                        startTransition(() => void muteEntityAction("user", post.authorId));
                      }}
                    >
                      {t("muteAuthor")}
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{post.content}</p>
          {post.code ? (
            <CodeBlock className="mt-3" code={post.code} language={post.language} />
          ) : null}
          {post.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map((item) => (
                <span
                  key={item.tag.name}
                  className="rounded-md bg-accent-muted px-2 py-0.5 text-[11px] text-secondary"
                >
                  {item.tag.name}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-1 text-xs text-secondary">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent-muted",
                liked && (post.community ? "text-[var(--community)]" : "text-accent"),
              )}
              onClick={() => {
                startTransition(async () => {
                  setLiked(!liked);
                  setLikeCount(likeCount + (liked ? -1 : 1));
                  await toggleLikeAction(post.id);
                });
              }}
            >
              <Heart className={cn("size-4", liked && "fill-current")} />
              {t("like")} {likeCount > 0 ? likeCount : ""}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent-muted"
              onClick={() => setShowComments((v) => !v)}
            >
              <MessageCircle className="size-4" />
              {t("comment")} {post._count.comments || ""}
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent-muted",
                saved && "text-accent",
              )}
              onClick={() => {
                startTransition(async () => {
                  setSaved(!saved);
                  await toggleSaveAction(post.id);
                });
              }}
            >
              <Bookmark className={cn("size-4", saved && "fill-current")} />
              {t("save")}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent-muted"
              onClick={() => {
                void navigator.clipboard.writeText(window.location.href);
                startTransition(() => void recordFeedInteractionAction({ postId: post.id, type: "SHARE" }));
              }}
            >
              <Share2 className="size-4" />
              {t("share")}
            </button>
          </div>
          {showComments ? (
            <div className="mt-4 space-y-3 border-t border-border pt-3">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar
                    name={comment.author.fullName}
                    src={comment.author.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1 rounded-lg bg-surface-elevated px-3 py-2">
                    <div className="flex justify-between gap-2">
                      <p className="text-xs font-medium">{comment.author.fullName}</p>
                      {comment.authorId === currentUserId ? (
                        <button
                          type="button"
                          className="text-[11px] text-muted hover:text-error"
                          onClick={() =>
                            startTransition(() => deleteCommentAction(comment.id))
                          }
                        >
                          {t("delete")}
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
              <form
                ref={commentFormRef}
                action={(formData) =>
                  startTransition(async () => {
                    await addCommentAction(post.id, formData);
                    commentFormRef.current?.reset();
                  })
                }
                className="flex gap-2"
              >
                <input
                  name="content"
                  placeholder={t("commentPlaceholder")}
                  className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none"
                />
                <button
                  type="submit"
                  className={cn(
                    "h-9 rounded-md px-3 text-sm text-white",
                    !post.community && "bg-accent",
                  )}
                  style={post.community ? { background: "var(--community)" } : undefined}
                >
                  {t("send")}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
