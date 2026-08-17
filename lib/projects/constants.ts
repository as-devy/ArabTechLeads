export const PROJECT_TYPES = [
  "OPEN_SOURCE",
  "STARTUP",
  "PORTFOLIO",
  "LEARNING",
  "RESEARCH",
  "HACKATHON",
  "COMMUNITY",
  "OTHER",
] as const;

export const PROJECT_STATUSES = [
  "PLANNING",
  "IN_PROGRESS",
  "COMPLETED",
  "PAUSED",
] as const;

export const COLLAB_STATUSES = ["LOOKING", "COMPLETE", "NOT_LOOKING"] as const;

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const SUGGESTED_PROJECT_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "UI/UX Designer",
  "DevOps",
  "Cybersecurity",
  "AI Engineer",
  "QA",
  "Technical Writer",
] as const;
