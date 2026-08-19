export type RecommendReason =
  | "matched_skill"
  | "matched_interest"
  | "followed_author"
  | "connection"
  | "community"
  | "project"
  | "trending"
  | "exploration";

export type InterestSource =
  | "EXPLICIT"
  | "BEHAVIOR"
  | "COMMUNITY"
  | "PROJECT"
  | "FOLLOW"
  | "INTERACTION";

export type UserInterest = {
  tagId: string;
  slug: string;
  name: string;
  weight: number;
  source: InterestSource;
};

export type UserInterestProfile = {
  profileId: string;
  interests: UserInterest[];
  followingIds: string[];
  connectionIds: string[];
  communityIds: string[];
  projectSkillTagIds: string[];
  mutedAuthorIds: string[];
  mutedTagIds: string[];
  blockedIds: string[];
  hiddenPostIds: string[];
};

export type FeedCandidate = {
  id: string;
  authorId: string;
  communityId: string | null;
  createdAt: Date;
  language: string | null;
  tagIds: string[];
  tagSlugs: string[];
  likeCount: number;
  commentCount: number;
  saveCount: number;
  sources: RecommendReason[];
  author: {
    createdAt: Date;
    bio: string | null;
    avatarUrl: string | null;
    githubUrl: string | null;
    onboardingCompleted: boolean;
  };
};

export type ScoredPost = FeedCandidate & {
  score: number;
  parts: {
    skillMatch: number;
    interestMatch: number;
    relationship: number;
    freshness: number;
    engagement: number;
    quality: number;
    community: number;
    discovery: number;
    repetitionPenalty: number;
    negativePenalty: number;
  };
  reason: RecommendReason;
};

export type FeedPage = {
  postIds: string[];
  nextCursor: string | null;
  hasMore: boolean;
  version: string;
};
