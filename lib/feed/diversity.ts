import { FEED_CONFIG } from "./config";
import type { ScoredPost } from "./types";

function primaryTopic(post: ScoredPost) {
  return post.tagSlugs[0] ?? post.language ?? "untagged";
}

export function applyDiversity(ranked: ScoredPost[]) {
  const selected: ScoredPost[] = [];
  const remaining = [...ranked];

  while (remaining.length > 0) {
    const index = remaining.findIndex((post) => {
      const lastAuthors = selected.slice(-FEED_CONFIG.maxConsecutiveAuthorPosts);
      const authorRepeat =
        lastAuthors.length === FEED_CONFIG.maxConsecutiveAuthorPosts &&
        lastAuthors.every((item) => item.authorId === post.authorId);
      const lastTopics = selected.slice(-FEED_CONFIG.maxConsecutiveSameTopicPosts);
      const topicRepeat =
        lastTopics.length === FEED_CONFIG.maxConsecutiveSameTopicPosts &&
        lastTopics.every((item) => primaryTopic(item) === primaryTopic(post));
      return !authorRepeat && !topicRepeat;
    });
    const pickAt = index >= 0 ? index : 0;
    const [picked] = remaining.splice(pickAt, 1);
    if (picked) selected.push(picked);
  }

  return selected;
}

export function mixExploration(ranked: ScoredPost[]) {
  const exploration = ranked.filter(
    (post) => post.reason === "exploration" || (post.parts.skillMatch < 0.18 && post.parts.interestMatch < 0.18),
  );
  const core = ranked.filter((post) => !exploration.includes(post));
  if (exploration.length === 0) return applyDiversity(ranked);

  const mixed: ScoredPost[] = [];
  const coreQueue = applyDiversity(core);
  const exploreQueue = [...exploration];
  const every = Math.max(3, Math.round(1 / FEED_CONFIG.explorationRatio));

  while (coreQueue.length > 0 || exploreQueue.length > 0) {
    if (mixed.length > 0 && mixed.length % every === 0 && exploreQueue.length > 0) {
      mixed.push(exploreQueue.shift()!);
      continue;
    }
    if (coreQueue.length > 0) mixed.push(coreQueue.shift()!);
    else if (exploreQueue.length > 0) mixed.push(exploreQueue.shift()!);
  }
  return mixed;
}
