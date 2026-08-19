import { prisma } from "@/lib/prisma";
import { FEED_CONFIG } from "./config";
import type { FeedCandidate, RecommendReason, UserInterestProfile } from "./types";

const candidateInclude = {
  author: {
    select: {
      createdAt: true,
      bio: true,
      avatarUrl: true,
      githubUrl: true,
      onboardingCompleted: true,
      suspendedAt: true,
    },
  },
  tags: { include: { tag: true } },
  _count: { select: { likes: true, comments: true, savedBy: true } },
} as const;

type Loaded = {
  id: string;
  authorId: string;
  communityId: string | null;
  createdAt: Date;
  language: string | null;
  author: {
    createdAt: Date;
    bio: string | null;
    avatarUrl: string | null;
    githubUrl: string | null;
    onboardingCompleted: boolean;
    suspendedAt: Date | null;
  };
  tags: { tagId: string; tag: { slug: string } }[];
  _count: { likes: number; comments: number; savedBy: number };
};

function toCandidate(post: Loaded, sources: RecommendReason[]): FeedCandidate | null {
  if (post.author.suspendedAt) return null;
  return {
    id: post.id,
    authorId: post.authorId,
    communityId: post.communityId,
    createdAt: post.createdAt,
    language: post.language,
    tagIds: post.tags.map((item) => item.tagId),
    tagSlugs: post.tags.map((item) => item.tag.slug),
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    saveCount: post._count.savedBy,
    sources,
    author: {
      createdAt: post.author.createdAt,
      bio: post.author.bio,
      avatarUrl: post.author.avatarUrl,
      githubUrl: post.author.githubUrl,
      onboardingCompleted: post.author.onboardingCompleted,
    },
  };
}

function authWhere(profile: UserInterestProfile) {
  const excludedAuthors = [...profile.mutedAuthorIds, ...profile.blockedIds].filter(
    (id) => id !== profile.profileId,
  );

  return {
    ...(profile.hiddenPostIds.length ? { id: { notIn: profile.hiddenPostIds } } : {}),
    ...(excludedAuthors.length ? { authorId: { notIn: excludedAuthors } } : {}),
    author: { suspendedAt: null },
    OR: [
      { communityId: null },
      { community: { isOpen: true } },
      { communityId: { in: profile.communityIds } },
    ],
  };
}

async function take(
  where: object,
  takeCount: number,
  source: RecommendReason,
  profile: UserInterestProfile,
) {
  const rows = (await prisma.post.findMany({
    where: { AND: [authWhere(profile), where] },
    orderBy: { createdAt: "desc" },
    take: takeCount,
    include: candidateInclude,
  })) as unknown as Loaded[];
  return rows
    .map((row) => toCandidate(row, [source]))
    .filter((row): row is FeedCandidate => Boolean(row));
}

export async function generateCandidates(profile: UserInterestProfile): Promise<FeedCandidate[]> {
  const topTagIds = profile.interests.slice(0, 12).map((item) => item.tagId);
  const twoDaysAgo = new Date(Date.now() - 48 * 3600_000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000);

  const [
    skillPosts,
    followPosts,
    connectionPosts,
    communityPosts,
    projectPosts,
    trending,
    recentQuality,
    discovery,
    ownPosts,
  ] = await Promise.all([
    topTagIds.length
      ? take(
          { tags: { some: { tagId: { in: topTagIds } } } },
          40,
          profile.interests[0]?.source === "EXPLICIT" ? "matched_skill" : "matched_interest",
          profile,
        )
      : Promise.resolve([]),
    profile.followingIds.length
      ? take({ authorId: { in: profile.followingIds } }, 30, "followed_author", profile)
      : Promise.resolve([]),
    profile.connectionIds.length
      ? take({ authorId: { in: profile.connectionIds } }, 20, "connection", profile)
      : Promise.resolve([]),
    profile.communityIds.length
      ? take({ communityId: { in: profile.communityIds } }, 30, "community", profile)
      : Promise.resolve([]),
    profile.projectSkillTagIds.length
      ? take(
          { tags: { some: { tagId: { in: profile.projectSkillTagIds } } } },
          20,
          "project",
          profile,
        )
      : Promise.resolve([]),
    take({ createdAt: { gte: twoDaysAgo } }, 25, "trending", profile),
    take({ createdAt: { gte: weekAgo }, comments: { some: {} } }, 15, "trending", profile),
    take(
      topTagIds.length ? { tags: { none: { tagId: { in: topTagIds.slice(0, 5) } } } } : {},
      18,
      "exploration",
      profile,
    ),
    take({ authorId: profile.profileId }, 8, "followed_author", profile),
  ]);

  const byId = new Map<string, FeedCandidate>();
  for (const post of [
    ...skillPosts,
    ...followPosts,
    ...connectionPosts,
    ...communityPosts,
    ...projectPosts,
    ...trending,
    ...recentQuality,
    ...discovery,
    ...ownPosts,
  ]) {
    const existing = byId.get(post.id);
    if (existing) {
      existing.sources = [...new Set([...existing.sources, ...post.sources])];
    } else {
      byId.set(post.id, post);
    }
  }

  return [...byId.values()].slice(0, FEED_CONFIG.candidateLimit);
}
