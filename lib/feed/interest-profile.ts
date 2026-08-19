import { slugify } from "@/lib/constants/taxonomy";
import { prisma } from "@/lib/prisma";
import { mutedIds } from "@/lib/trust/moderation";
import { FEED_CONFIG } from "./config";
import { ensureFeedTags } from "./tags";
import type { UserInterest, UserInterestProfile } from "./types";

function decay(weight: number, updatedAt: Date, halfLifeDays: number) {
  const ageDays = Math.max(0, (Date.now() - updatedAt.getTime()) / 86_400_000);
  return weight * Math.exp(-ageDays / halfLifeDays);
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

async function tagIdBySlug(slugs: string[]) {
  const unique = [...new Set(slugs.filter(Boolean))];
  if (unique.length === 0) return [];
  return prisma.tag.findMany({
    where: { slug: { in: unique } },
    select: { id: true, slug: true, name: true },
  });
}

export async function getUserInterestProfile(profileId: string): Promise<UserInterestProfile> {
  await ensureFeedTags();

  const [
    skills,
    interests,
    following,
    connections,
    communities,
    projects,
    snapshots,
    mutedAuthors,
    mutedTags,
    blocksMade,
    blocksRecv,
    hidden,
  ] = await Promise.all([
    prisma.profileSkill.findMany({
      where: { profileId },
      include: { skill: true },
    }),
    prisma.profileInterest.findMany({
      where: { profileId },
      include: { interest: true },
    }),
    prisma.follow.findMany({
      where: { followerId: profileId },
      select: { followingId: true },
    }),
    prisma.connection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: profileId }, { receiverId: profileId }],
      },
      select: { requesterId: true, receiverId: true },
    }),
    prisma.communityMember.findMany({
      where: { profileId },
      select: { communityId: true },
    }),
    prisma.projectMember.findMany({
      where: { profileId },
      include: { project: { include: { technologies: { include: { skill: true } } } } },
    }),
    prisma.userInterestProfile.findMany({
      where: { profileId },
      include: { tag: true },
    }),
    mutedIds(profileId, "user"),
    mutedIds(profileId, "tag"),
    prisma.userBlock.findMany({ where: { blockerId: profileId }, select: { blockedId: true } }),
    prisma.userBlock.findMany({ where: { blockedId: profileId }, select: { blockerId: true } }),
    prisma.postInteraction.findMany({
      where: { profileId, type: { in: ["HIDE", "NOT_INTERESTED"] } },
      select: { postId: true },
      distinct: ["postId"],
      take: 200,
    }),
  ]);

  const skillSlugs = skills.map((row) => slugify(row.skill.name));
  const interestSlugs = interests.map((row) => row.interest.slug);
  const projectSlugs = projects.flatMap((row) =>
    row.project.technologies.map((tech) => slugify(tech.skill.name)),
  );
  const catalog = await tagIdBySlug([...skillSlugs, ...interestSlugs, ...projectSlugs]);
  const bySlug = new Map(catalog.map((tag) => [tag.slug, tag]));

  const explicit: UserInterest[] = [];
  for (const slug of skillSlugs) {
    const tag = bySlug.get(slug);
    if (tag) {
      explicit.push({
        tagId: tag.id,
        slug: tag.slug,
        name: tag.name,
        weight: FEED_CONFIG.sourceWeights.EXPLICIT,
        source: "EXPLICIT",
      });
    }
  }
  for (const slug of interestSlugs) {
    const tag = bySlug.get(slug);
    if (tag && !explicit.some((item) => item.tagId === tag.id)) {
      explicit.push({
        tagId: tag.id,
        slug: tag.slug,
        name: tag.name,
        weight: 0.82,
        source: "EXPLICIT",
      });
    }
  }

  const projectInterests: UserInterest[] = [];
  for (const slug of projectSlugs) {
    const tag = bySlug.get(slug);
    if (!tag || explicit.some((item) => item.tagId === tag.id)) continue;
    if (projectInterests.some((item) => item.tagId === tag.id)) continue;
    projectInterests.push({
      tagId: tag.id,
      slug: tag.slug,
      name: tag.name,
      weight: FEED_CONFIG.sourceWeights.PROJECT,
      source: "PROJECT",
    });
  }

  const behavioral = snapshots
    .filter((row) => row.source === "BEHAVIOR")
    .map((row) => ({
      tagId: row.tagId,
      slug: row.tag.slug,
      name: row.tag.name,
      weight: clamp(decay(row.weight, row.updatedAt, FEED_CONFIG.interestHalfLifeDays)),
      source: "BEHAVIOR" as const,
    }))
    .filter((row) => row.weight >= 0.08);

  const merged = new Map<string, UserInterest>();
  for (const item of [...explicit, ...projectInterests, ...behavioral]) {
    const current = merged.get(item.tagId);
    if (!current || item.weight > current.weight) merged.set(item.tagId, item);
  }

  const connectionIds = connections.map((row) =>
    row.requesterId === profileId ? row.receiverId : row.requesterId,
  );

  return {
    profileId,
    interests: [...merged.values()].sort((a, b) => b.weight - a.weight),
    followingIds: following.map((row) => row.followingId),
    connectionIds,
    communityIds: communities.map((row) => row.communityId),
    projectSkillTagIds: projectInterests.map((item) => item.tagId),
    mutedAuthorIds: mutedAuthors,
    mutedTagIds: mutedTags,
    blockedIds: [
      ...blocksMade.map((row) => row.blockedId),
      ...blocksRecv.map((row) => row.blockerId),
    ],
    hiddenPostIds: hidden.map((row) => row.postId),
  };
}

export async function bumpInterestFromPost(
  profileId: string,
  postId: string,
  type: keyof typeof FEED_CONFIG.interactionWeights,
) {
  const delta = FEED_CONFIG.interactionWeights[type];
  const tags = await prisma.postTag.findMany({
    where: { postId },
    select: { tagId: true },
  });
  if (tags.length === 0) return;

  for (const tag of tags) {
    const existing = await prisma.userInterestProfile.findUnique({
      where: {
        profileId_tagId_source: { profileId, tagId: tag.tagId, source: "BEHAVIOR" },
      },
    });
    const signalCount = await prisma.postInteraction.count({
      where: {
        profileId,
        type: { in: ["VIEW", "LIKE", "COMMENT", "SAVE", "SHARE"] },
        post: { tags: { some: { tagId: tag.tagId } } },
      },
    });
    if (!existing && delta > 0 && signalCount < FEED_CONFIG.implicitRepeatThreshold) {
      continue;
    }
    const next = clamp((existing?.weight ?? 0.18) + delta * 0.04);
    await prisma.userInterestProfile.upsert({
      where: {
        profileId_tagId_source: { profileId, tagId: tag.tagId, source: "BEHAVIOR" },
      },
      update: { weight: next },
      create: { profileId, tagId: tag.tagId, source: "BEHAVIOR", weight: clamp(0.22) },
    });
  }
}
