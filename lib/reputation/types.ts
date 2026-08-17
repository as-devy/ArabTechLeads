export type ReputationCategory =
  | "TECHNICAL"
  | "COMMUNITY"
  | "PROJECT"
  | "COLLABORATION"
  | "MENTORSHIP"
  | "OPEN_SOURCE";

export type ReputationEventInput = {
  profileId: string;
  category: ReputationCategory;
  eventKey: string;
  sourceId: string;
  points: number;
};
