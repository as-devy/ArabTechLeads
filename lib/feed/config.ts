export const FEED_ALGORITHM_VERSION = "v1";

export const FEED_CONFIG = {
  algorithmVersion: FEED_ALGORITHM_VERSION,
  candidateLimit: 100,
  pageSize: 12,
  explorationRatio: 0.1,
  relatedRatio: 0.2,
  maxConsecutiveAuthorPosts: 2,
  maxConsecutiveSameTopicPosts: 3,
  freshnessHalfLifeHours: 24,
  interestHalfLifeDays: 45,
  viewVisibleMs: 2000,
  impressionMinRatio: 0.45,
  impressionDedupeMinutes: 30,
  implicitRepeatThreshold: 2,
  maxTagsPerPost: 5,
  weights: {
    skillMatch: 0.3,
    interestMatch: 0.15,
    relationship: 0.15,
    freshness: 0.15,
    engagement: 0.1,
    quality: 0.1,
    community: 0.05,
  },
  interactionWeights: {
    IMPRESSION: 0.1,
    VIEW: 1,
    LIKE: 2,
    COMMENT: 3,
    SAVE: 4,
    SHARE: 5,
    HIDE: -5,
    NOT_INTERESTED: -5,
  },
  sourceWeights: {
    EXPLICIT: 0.95,
    PROJECT: 0.7,
    COMMUNITY: 0.55,
    BEHAVIOR: 0.75,
    FOLLOW: 0.4,
    INTERACTION: 0.5,
  },
} as const;

export type FeedConfig = typeof FEED_CONFIG;
