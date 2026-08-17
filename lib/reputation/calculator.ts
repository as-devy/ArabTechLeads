import { prisma } from "@/lib/prisma";
import { CATEGORY_CAP } from "./rules";
import type { ReputationCategory } from "./types";

const CATEGORIES: ReputationCategory[] = [
  "TECHNICAL",
  "COMMUNITY",
  "PROJECT",
  "COLLABORATION",
  "MENTORSHIP",
  "OPEN_SOURCE",
];

export async function getReputationSummary(profileId: string) {
  const grouped = await prisma.reputationEvent.groupBy({
    by: ["category"],
    where: { profileId },
    _sum: { points: true },
  });

  const map = Object.fromEntries(
    grouped.map((row) => [row.category, Math.min(CATEGORY_CAP, row._sum.points ?? 0)]),
  ) as Partial<Record<ReputationCategory, number>>;

  return CATEGORIES.map((category) => ({
    category,
    score: map[category] ?? 0,
  }));
}
