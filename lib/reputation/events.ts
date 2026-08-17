import { prisma } from "@/lib/prisma";
import { REPUTATION_RULES } from "./rules";

export async function recordReputationEvent(
  profileId: string,
  eventKey: keyof typeof REPUTATION_RULES,
  sourceId: string,
) {
  const rule = REPUTATION_RULES[eventKey];
  if (!rule) return;

  await prisma.reputationEvent.upsert({
    where: {
      profileId_eventKey_sourceId: {
        profileId,
        eventKey,
        sourceId,
      },
    },
    update: {},
    create: {
      profileId,
      eventKey,
      sourceId,
      category: rule.category,
      points: rule.points,
    },
  });
}
