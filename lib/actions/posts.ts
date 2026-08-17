"use server";

import { revalidatePath } from "next/cache";
import { PostType } from "@/lib/generated/prisma/client";
import { requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function createPostAction(formData: FormData) {
  const profile = await requireProfile();
  const content = String(formData.get("content") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const language = String(formData.get("language") ?? "").trim();
  const communityId = String(formData.get("communityId") ?? "").trim() || null;
  const type = code ? PostType.CODE : PostType.TEXT;

  if (!content && !code) return { error: "empty" };

  if (communityId) {
    const member = await prisma.communityMember.findUnique({
      where: { communityId_profileId: { communityId, profileId: profile.id } },
    });
    if (!member) return { error: "forbidden" };
  }

  const post = await prisma.post.create({
    data: {
      authorId: profile.id,
      type,
      content: content || (language ? `Code (${language})` : "Code"),
      code: code || null,
      language: language || null,
      communityId,
    },
  });

  if (communityId) {
    await prisma.communityPost.create({
      data: { communityId, postId: post.id },
    });
  }

  revalidatePath("/app");
  if (communityId) revalidatePath("/app/communities");
  return { ok: true };
}

export async function deletePostAction(postId: string) {
  const profile = await requireProfile();
  await prisma.post.deleteMany({
    where: { id: postId, authorId: profile.id },
  });
  revalidatePath("/app");
}

export async function toggleLikeAction(postId: string) {
  const profile = await requireProfile();
  const existing = await prisma.postLike.findUnique({
    where: { postId_profileId: { postId, profileId: profile.id } },
  });

  if (existing) {
    await prisma.postLike.delete({
      where: { postId_profileId: { postId, profileId: profile.id } },
    });
  } else {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    await prisma.postLike.create({
      data: { postId, profileId: profile.id },
    });
    if (post && post.authorId !== profile.id) {
      await prisma.notification.create({
        data: {
          recipientId: post.authorId,
          actorId: profile.id,
          type: "LIKE",
          postId,
        },
      });
    }
  }

  revalidatePath("/app");
}

export async function toggleSaveAction(postId: string) {
  const profile = await requireProfile();
  const existing = await prisma.savedPost.findUnique({
    where: { postId_profileId: { postId, profileId: profile.id } },
  });

  if (existing) {
    await prisma.savedPost.delete({
      where: { postId_profileId: { postId, profileId: profile.id } },
    });
  } else {
    await prisma.savedPost.create({
      data: { postId, profileId: profile.id },
    });
  }

  revalidatePath("/app");
  revalidatePath("/app/saved");
}

export async function addCommentAction(postId: string, formData: FormData) {
  const profile = await requireProfile();
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  await prisma.comment.create({
    data: { postId, authorId: profile.id, content },
  });

  if (post && post.authorId !== profile.id) {
    await prisma.notification.create({
      data: {
        recipientId: post.authorId,
        actorId: profile.id,
        type: "COMMENT",
        postId,
      },
    });
  }

  revalidatePath("/app");
}

export async function deleteCommentAction(commentId: string) {
  const profile = await requireProfile();
  await prisma.comment.deleteMany({
    where: { id: commentId, authorId: profile.id },
  });
  revalidatePath("/app");
}
