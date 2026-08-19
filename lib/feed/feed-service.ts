import { prisma } from "@/lib/prisma";
import { feedPostInclude, toFeedPost, type FeedPost } from "@/lib/posts/feed";
import { FEED_CONFIG } from "./config";
import { generateCandidates } from "./candidate-generator";
import { getUserInterestProfile } from "./interest-profile";
import { rankCandidates } from "./ranking";

function encodeCursor(ids: string[], index: number) {
  return Buffer.from(JSON.stringify({ v: FEED_CONFIG.algorithmVersion, i: index, n: ids.length }), "utf8").toString(
    "base64url",
  );
}

function decodeCursor(cursor?: string | null) {
  if (!cursor) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as { i?: number };
    return typeof parsed.i === "number" && parsed.i >= 0 ? parsed.i : 0;
  } catch {
    return 0;
  }
}

export async function getPersonalizedFeed(input: {
  userId: string;
  cursor?: string | null;
  limit?: number;
}): Promise<{
  posts: (FeedPost & { recommendReason?: string })[];
  nextCursor: string | null;
  hasMore: boolean;
  version: string;
}> {
  const limit = Math.min(24, Math.max(1, input.limit ?? FEED_CONFIG.pageSize));
  const profile = await getUserInterestProfile(input.userId);
  const candidates = await generateCandidates(profile);
  const ranked = rankCandidates(candidates, profile);
  const ids = ranked.map((item) => item.id);
  const start = decodeCursor(input.cursor);
  const pageIds = ids.slice(start, start + limit);
  const reasonById = new Map(ranked.map((item) => [item.id, item.reason]));

  const rows =
    pageIds.length === 0
      ? []
      : await prisma.post.findMany({
          where: { id: { in: pageIds } },
          include: feedPostInclude(input.userId),
        });
  const byId = new Map(rows.map((row) => [row.id, row]));
  const posts: (FeedPost & { recommendReason?: string })[] = [];
  for (const id of pageIds) {
    const row = byId.get(id);
    if (!row) continue;
    posts.push({
      ...toFeedPost(row),
      recommendReason: reasonById.get(id),
    });
  }

  const nextIndex = start + pageIds.length;
  const hasMore = nextIndex < ids.length;

  return {
    posts,
    nextCursor: hasMore ? encodeCursor(ids, nextIndex) : null,
    hasMore,
    version: FEED_CONFIG.algorithmVersion,
  };
}
