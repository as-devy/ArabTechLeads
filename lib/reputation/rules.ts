import type { ReputationCategory } from "./types";

export const REPUTATION_RULES: Record<
  string,
  { category: ReputationCategory; points: number }
> = {
  task_completed: { category: "PROJECT", points: 4 },
  project_completed: { category: "PROJECT", points: 18 },
  open_source_join: { category: "OPEN_SOURCE", points: 10 },
  helpful_comment: { category: "COMMUNITY", points: 2 },
  technical_post: { category: "TECHNICAL", points: 5 },
  code_post: { category: "TECHNICAL", points: 6 },
  mentorship_completed: { category: "MENTORSHIP", points: 12 },
  hackathon_participation: { category: "PROJECT", points: 8 },
  skill_verified: { category: "TECHNICAL", points: 10 },
  endorsement_received: { category: "COLLABORATION", points: 3 },
  recommendation_accepted: { category: "COLLABORATION", points: 8 },
  event_attended: { category: "COMMUNITY", points: 3 },
};

export const CATEGORY_CAP = 100;
