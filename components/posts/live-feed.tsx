"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { PostCard, type FeedPost } from "@/components/posts/post-card";
import { FeedImpression } from "@/components/posts/feed-impression";
import { getFeedPostAction } from "@/lib/actions/posts";
import { loadPersonalizedFeedAction } from "@/lib/actions/feed";
import { getRealtimeClient, rowId, type RealtimeChange } from "@/lib/realtime/browser";
import { toFeedPost } from "@/lib/posts/feed";

export type LiveFeedScope =
  | { kind: "following"; authorIds: string[] }
  | { kind: "all" }
  | { kind: "code" }
  | { kind: "community"; communityId: string }
  | { kind: "existing" }
  | { kind: "personalized" };

function shouldAcceptPost(
  scope: LiveFeedScope,
  payload: { authorId: string | null; communityId: string | null; type: string | null },
) {
  if (scope.kind === "existing") return false;
  if (scope.kind === "following") {
    return Boolean(payload.authorId && scope.authorIds.includes(payload.authorId));
  }
  if (scope.kind === "community") {
    return payload.communityId === scope.communityId;
  }
  if (scope.kind === "code") return payload.type === "CODE";
  return true;
}

export function LiveFeed({
  posts: initialPosts,
  currentUserId,
  scope,
  empty,
  nextCursor: initialCursor = null,
  hasMore: initialHasMore = false,
}: {
  posts: FeedPost[];
  currentUserId: string;
  scope: LiveFeedScope;
  empty?: ReactNode;
  nextCursor?: string | null;
  hasMore?: boolean;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const postsRef = useRef(posts);
  const scopeRef = useRef(scope);
  const pending = useRef(new Set<string>());
  const sentinelRef = useRef<HTMLDivElement>(null);
  postsRef.current = posts;
  scopeRef.current = scope;

  useEffect(() => {
    setPosts(initialPosts);
    setCursor(initialCursor);
    setHasMore(initialHasMore);
  }, [initialPosts, initialCursor, initialHasMore]);

  const upsert = useCallback(async (postId: string, insert = false) => {
    if (pending.current.has(postId)) return;
    pending.current.add(postId);
    try {
      const loaded = await getFeedPostAction(postId);
      if (!loaded) {
        if (!insert) setPosts((prev) => prev.filter((post) => post.id !== postId));
        return;
      }
      const next = toFeedPost(loaded);
      setPosts((prev) => {
        const index = prev.findIndex((post) => post.id === next.id);
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = next;
          return copy;
        }
        return insert ? [next, ...prev] : prev;
      });
    } finally {
      pending.current.delete(postId);
    }
  }, []);

  useEffect(() => {
    const supabase = getRealtimeClient();
    if (!supabase) return;

    const handle = (change: RealtimeChange) => {
      if (change.table === "posts") {
        const postId = rowId(change.new, "id") ?? rowId(change.old, "id");
        if (!postId) return;
        if (change.eventType === "DELETE") {
          setPosts((prev) => prev.filter((post) => post.id !== postId));
          return;
        }
        const exists = postsRef.current.some((post) => post.id === postId);
        if (exists) {
          void upsert(postId);
          return;
        }
        const authorId = rowId(change.new, "author_id");
        const communityId = rowId(change.new, "community_id");
        const type = typeof change.new.type === "string" ? change.new.type : null;
        if (shouldAcceptPost(scopeRef.current, { authorId, communityId, type })) {
          void upsert(postId, true);
        }
        return;
      }

      const postId = rowId(change.new, "post_id") ?? rowId(change.old, "post_id");
      if (postId) {
        if (postsRef.current.some((post) => post.id === postId)) void upsert(postId);
        return;
      }
      if (change.table === "comments" && change.eventType === "DELETE") {
        const commentId = rowId(change.old, "id");
        if (!commentId) return;
        setPosts((prev) =>
          prev.map((post) => {
            if (!post.comments.some((comment) => comment.id === commentId)) return post;
            return {
              ...post,
              comments: post.comments.filter((comment) => comment.id !== commentId),
              _count: {
                ...post._count,
                comments: Math.max(0, post._count.comments - 1),
              },
            };
          }),
        );
      }
    };

    const channel = supabase.channel(`live-feed:${currentUserId}:${scope.kind}`);
    for (const table of ["posts", "comments", "post_likes"] as const) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
        handle({
          table,
          eventType: payload.eventType as RealtimeChange["eventType"],
          new: (payload.new ?? {}) as Record<string, unknown>,
          old: (payload.old ?? {}) as Record<string, unknown>,
        });
      });
    }
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, scope.kind, upsert]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || loadingMore || scope.kind !== "personalized") return;
    setLoadingMore(true);
    try {
      const page = await loadPersonalizedFeedAction(cursor);
      setPosts((prev) => {
        const seen = new Set(prev.map((post) => post.id));
        return [...prev, ...page.posts.filter((post) => !seen.has(post.id))];
      });
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, loadingMore, scope.kind]);

  useEffect(() => {
    if (scope.kind !== "personalized") return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMore();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, scope.kind]);

  if (posts.length === 0) return empty ?? null;

  return (
    <div className="space-y-3">
      {posts.map((post, index) => (
        <FeedImpression key={post.id} postId={post.id} position={index}>
          <PostCard
            currentUserId={currentUserId}
            post={post}
            onDismiss={(postId) => setPosts((prev) => prev.filter((item) => item.id !== postId))}
          />
        </FeedImpression>
      ))}
      {scope.kind === "personalized" ? <div ref={sentinelRef} className="h-8" /> : null}
    </div>
  );
}
