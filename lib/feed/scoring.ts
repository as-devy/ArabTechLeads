import { FEED_CONFIG } from "./config";
import type { FeedCandidate, RecommendReason, ScoredPost, UserInterestProfile } from "./types";

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function freshnessScore(createdAt: Date, halfLifeHours = FEED_CONFIG.freshnessHalfLifeHours) {
  const ageHours = Math.max(0, (Date.now() - createdAt.getTime()) / 3_600_000);
  return Math.exp(-ageHours / halfLifeHours);
}

export function engagementScore(post: FeedCandidate) {
  const ageHours = Math.max(1, (Date.now() - post.createdAt.getTime()) / 3_600_000);
  const raw = post.likeCount + post.commentCount * 2 + post.saveCount * 3;
  return clamp(raw / (ageHours + 2) / 4);
}

export function qualityScore(post: FeedCandidate) {
  const saves = clamp(post.saveCount / 8);
  const comments = clamp(post.commentCount / 10);
  const complete =
    (post.author.onboardingCompleted ? 0.25 : 0) +
    (post.author.bio ? 0.15 : 0) +
    (post.author.avatarUrl ? 0.1 : 0) +
    (post.author.githubUrl ? 0.15 : 0);
  const accountDays = (Date.now() - post.author.createdAt.getTime()) / 86_400_000;
  const established = accountDays > 14 ? 0.15 : 0.2;
  return clamp(saves * 0.35 + comments * 0.25 + complete + established);
}

function overlap(postTags: string[], wanted: Map<string, number>) {
  if (postTags.length === 0 || wanted.size === 0) return 0;
  let weighted = 0;
  let hits = 0;
  for (const tagId of postTags) {
    const weight = wanted.get(tagId);
    if (weight) {
      weighted += weight;
      hits += 1;
    }
  }
  return clamp((hits / postTags.length) * 0.55 + weighted / Math.max(1, hits) * 0.45);
}

function pickReason(post: FeedCandidate, parts: ScoredPost["parts"]): RecommendReason {
  if (post.sources.includes("exploration") && parts.skillMatch < 0.2) return "exploration";
  const ranked: [RecommendReason, number][] = [
    ["matched_skill", parts.skillMatch],
    ["matched_interest", parts.interestMatch],
    ["followed_author", parts.relationship],
    ["community", parts.community],
    ["project", post.sources.includes("project") ? 0.8 : 0],
    ["trending", parts.engagement],
  ];
  ranked.sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? post.sources[0] ?? "trending";
}

export function scoreCandidate(post: FeedCandidate, profile: UserInterestProfile): ScoredPost {
  const explicit = new Map(
    profile.interests.filter((item) => item.source === "EXPLICIT").map((item) => [item.tagId, item.weight]),
  );
  const implicit = new Map(
    profile.interests.filter((item) => item.source !== "EXPLICIT").map((item) => [item.tagId, item.weight]),
  );

  const skillMatch = overlap(post.tagIds, explicit);
  const interestMatch = overlap(post.tagIds, implicit);
  const relationship = post.authorId === profile.profileId
    ? 0.35
    : profile.followingIds.includes(post.authorId)
      ? 0.72
      : profile.connectionIds.includes(post.authorId)
        ? 0.5
        : 0;
  const freshness = freshnessScore(post.createdAt);
  const engagement = engagementScore(post);
  const quality = qualityScore(post);
  const community = post.communityId && profile.communityIds.includes(post.communityId) ? 1 : 0;
  const projectBoost = post.tagIds.some((id) => profile.projectSkillTagIds.includes(id)) ? 0.65 : 0;
  const discovery = clamp(1 - Math.max(skillMatch, interestMatch));
  const mutedTagHit = post.tagIds.filter((id) => profile.mutedTagIds.includes(id)).length;
  const negativePenalty = mutedTagHit * 0.35;

  const w = FEED_CONFIG.weights;
  const score =
    skillMatch * w.skillMatch +
    interestMatch * w.interestMatch +
    relationship * w.relationship +
    freshness * w.freshness +
    engagement * w.engagement +
    quality * w.quality +
    Math.max(community, projectBoost) * w.community +
    discovery * 0.04 -
    negativePenalty;

  const parts = {
    skillMatch,
    interestMatch,
    relationship,
    freshness,
    engagement,
    quality,
    community: Math.max(community, projectBoost),
    discovery,
    repetitionPenalty: 0,
    negativePenalty,
  };

  return {
    ...post,
    score,
    parts,
    reason: pickReason(post, parts),
  };
}
