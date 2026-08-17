"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function toggleFollowAction(targetId: string) {
  const profile = await requireProfile();
  if (profile.id === targetId) return;
  const { isBlockedPair } = await import("@/lib/trust/moderation");
  if (await isBlockedPair(profile.id, targetId)) return;

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId: profile.id, followingId: targetId },
    },
  });

  if (existing) {
    await prisma.follow.delete({
      where: {
        followerId_followingId: { followerId: profile.id, followingId: targetId },
      },
    });
  } else {
    await prisma.follow.create({
      data: { followerId: profile.id, followingId: targetId },
    });
    await prisma.notification.create({
      data: {
        recipientId: targetId,
        actorId: profile.id,
        type: "FOLLOW",
      },
    });
  }

  revalidatePath("/app/developers");
  revalidatePath("/app/network");
}

export async function requestConnectionAction(targetId: string) {
  const profile = await requireProfile();
  if (profile.id === targetId) return;
  const { isBlockedPair } = await import("@/lib/trust/moderation");
  if (await isBlockedPair(profile.id, targetId)) return;

  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: profile.id, receiverId: targetId },
        { requesterId: targetId, receiverId: profile.id },
      ],
    },
  });
  if (existing) return;

  await prisma.connection.create({
    data: { requesterId: profile.id, receiverId: targetId },
  });
  await prisma.notification.create({
    data: {
      recipientId: targetId,
      actorId: profile.id,
      type: "CONNECTION_REQUEST",
    },
  });
  revalidatePath("/app/network");
}

export async function cancelConnectionAction(connectionId: string) {
  const profile = await requireProfile();
  await prisma.connection.deleteMany({
    where: { id: connectionId, requesterId: profile.id, status: "PENDING" },
  });
  revalidatePath("/app/network");
}

export async function respondConnectionAction(
  connectionId: string,
  status: "ACCEPTED" | "REJECTED",
) {
  const profile = await requireProfile();
  const connection = await prisma.connection.findFirst({
    where: { id: connectionId, receiverId: profile.id, status: "PENDING" },
  });
  if (!connection) return;

  await prisma.connection.update({
    where: { id: connectionId },
    data: { status },
  });

  if (status === "ACCEPTED") {
    await prisma.notification.create({
      data: {
        recipientId: connection.requesterId,
        actorId: profile.id,
        type: "CONNECTION_ACCEPTED",
      },
    });
  }

  revalidatePath("/app/network");
}

export async function removeConnectionAction(connectionId: string) {
  const profile = await requireProfile();
  await prisma.connection.deleteMany({
    where: {
      id: connectionId,
      status: "ACCEPTED",
      OR: [{ requesterId: profile.id }, { receiverId: profile.id }],
    },
  });
  revalidatePath("/app/network");
}

export async function toggleCommunityMembershipAction(communityId: string) {
  const profile = await requireProfile();
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) return;

  const existing = await prisma.communityMember.findUnique({
    where: { communityId_profileId: { communityId, profileId: profile.id } },
  });

  if (existing) {
    if (existing.role === "owner" || community.createdById === profile.id) return;
    await prisma.communityMember.delete({
      where: { communityId_profileId: { communityId, profileId: profile.id } },
    });
  } else {
    if (!community.isOpen) return;
    await prisma.communityMember.create({
      data: { communityId, profileId: profile.id },
    });
  }

  revalidatePath("/app/communities");
  revalidatePath(`/app/communities/${community.slug}`);
}

export async function markNotificationsReadAction() {
  const profile = await requireProfile();
  await prisma.notification.updateMany({
    where: { recipientId: profile.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/app/notifications");
}

export async function markNotificationReadAction(id: string) {
  const profile = await requireProfile();
  await prisma.notification.updateMany({
    where: { id, recipientId: profile.id },
    data: { isRead: true },
  });
  revalidatePath("/app/notifications");
}

export async function updateProfileSettingsAction(formData: FormData) {
  const profile = await requireProfile();
  const githubUrl = String(formData.get("githubUrl") ?? "") || null;
  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      fullName: String(formData.get("fullName") ?? "").trim() || profile.fullName,
      bio: String(formData.get("bio") ?? "") || null,
      avatarUrl: String(formData.get("avatarUrl") ?? "") || null,
      githubUrl,
      linkedinUrl: String(formData.get("linkedinUrl") ?? "") || null,
      portfolioUrl: String(formData.get("portfolioUrl") ?? "") || null,
      locale: String(formData.get("locale") ?? profile.locale),
      theme: String(formData.get("theme") ?? profile.theme),
    },
  });
  const ghUser = githubUrl?.match(/github\.com\/([^/#?]+)/i)?.[1];
  if (ghUser) {
    await prisma.githubAccount.upsert({
      where: { profileId: profile.id },
      update: {
        githubUsername: ghUser,
        githubProfileUrl: `https://github.com/${ghUser}`,
      },
      create: {
        profileId: profile.id,
        githubUsername: ghUser,
        githubProfileUrl: `https://github.com/${ghUser}`,
      },
    });
  }
  revalidatePath("/app/settings");
}

export async function sendMessageAction(conversationId: string, formData: FormData) {
  const profile = await requireProfile();
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_profileId: { conversationId, profileId: profile.id },
    },
  });
  if (!member) return;

  await prisma.message.create({
    data: { conversationId, senderId: profile.id, content },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  revalidatePath("/app/messages");
}

export async function startConversationAction(otherId: string) {
  const profile = await requireProfile();
  if (profile.id === otherId) return;
  const { isBlockedPair } = await import("@/lib/trust/moderation");
  if (await isBlockedPair(profile.id, otherId)) return;

  const accepted = await prisma.connection.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: profile.id, receiverId: otherId },
        { requesterId: otherId, receiverId: profile.id },
      ],
    },
  });
  if (!accepted) return;

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { members: { some: { profileId: profile.id } } },
        { members: { some: { profileId: otherId } } },
      ],
    },
  });
  const conversationId =
    existing?.id ??
    (
      await prisma.conversation.create({
        data: {
          members: {
            create: [{ profileId: profile.id }, { profileId: otherId }],
          },
        },
      })
    ).id;

  redirect(`/app/messages?c=${conversationId}`);
}
