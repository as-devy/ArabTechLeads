import { PostInteractionType } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { FEED_CONFIG } from "./config";
import { bumpInterestFromPost } from "./interest-profile";

const LEARNING_TYPES = new Set<PostInteractionType>([
  "VIEW",
  "LIKE",
  "COMMENT",
  "SAVE",
  "SHARE",
  "HIDE",
  "NOT_INTERESTED",
]);

export async function recordPostInteraction(input: {
  profileId: string;
  postId: string;
  type: PostInteractionType;
  position?: number;
}) {
  if (input.type === "IMPRESSION" || input.type === "VIEW") {
    const since = new Date(Date.now() - FEED_CONFIG.impressionDedupeMinutes * 60_000);
    const recent = await prisma.postInteraction.findFirst({
      where: {
        profileId: input.profileId,
        postId: input.postId,
        type: input.type,
        createdAt: { gte: since },
      },
      select: { id: true },
    });
    if (recent) return { ok: true, deduped: true };
  }

  await prisma.postInteraction.create({
    data: {
      profileId: input.profileId,
      postId: input.postId,
      type: input.type,
      position: input.position,
      feedVersion: FEED_CONFIG.algorithmVersion,
    },
  });

  if (LEARNING_TYPES.has(input.type)) {
    await bumpInterestFromPost(input.profileId, input.postId, input.type);
  }

  return { ok: true, deduped: false };
}
