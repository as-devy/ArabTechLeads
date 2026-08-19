"use server";

import type { PostInteractionType } from "@/lib/generated/prisma/client";
import { requireProfile } from "@/lib/auth/session";
import { getPersonalizedFeed } from "@/lib/feed/feed-service";
import { recordPostInteraction } from "@/lib/feed/interactions";
import { listFeedTags } from "@/lib/feed/tags";

export async function loadPersonalizedFeedAction(cursor?: string | null) {
  const profile = await requireProfile();
  return getPersonalizedFeed({ userId: profile.id, cursor });
}

export async function listFeedTagsAction() {
  await requireProfile();
  return listFeedTags();
}

export async function recordFeedInteractionAction(input: {
  postId: string;
  type: PostInteractionType;
  position?: number;
}) {
  const profile = await requireProfile();
  if (!input.postId || !input.type) return { ok: false };
  return recordPostInteraction({
    profileId: profile.id,
    postId: input.postId,
    type: input.type,
    position: input.position,
  });
}

export async function hideFeedPostAction(postId: string) {
  const profile = await requireProfile();
  await recordPostInteraction({ profileId: profile.id, postId, type: "HIDE" });
  return { ok: true };
}

export async function notInterestedAction(postId: string) {
  const profile = await requireProfile();
  await recordPostInteraction({ profileId: profile.id, postId, type: "NOT_INTERESTED" });
  return { ok: true };
}
