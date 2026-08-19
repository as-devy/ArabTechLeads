import { mixExploration } from "./diversity";
import { scoreCandidate } from "./scoring";
import type { FeedCandidate, ScoredPost, UserInterestProfile } from "./types";

export function rankCandidates(
  candidates: FeedCandidate[],
  profile: UserInterestProfile,
): ScoredPost[] {
  const scored = candidates
    .map((candidate) => scoreCandidate(candidate, profile))
    .sort((a, b) => b.score - a.score);
  return mixExploration(scored);
}
