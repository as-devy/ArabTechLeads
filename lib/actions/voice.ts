"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { NotificationType, VoiceRole, VoiceRoomType, VoiceVisibility } from "@/lib/generated/prisma/client";
import { requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  VoiceError,
  assertCanInvite,
  assertModeratorCanChangeRole,
  canCreateVoiceRoom,
  canJoinVoiceRoom,
  canManageVoiceRoom,
  canModerateVoiceRoom,
  getActiveVoiceRole,
  getVoiceRoomAuth,
} from "@/lib/voice/access";
import {
  endAbandonedVoiceRooms,
  fireDueVoiceReminders,
  logVoiceEvent,
  markRoomEnded,
  touchRoom,
} from "@/lib/voice/lifecycle";
import {
  ensureLiveKitRoom,
  muteLiveKitParticipant,
  removeLiveKitParticipant,
  updateLiveKitPublish,
} from "@/lib/voice/livekit-server";
import { VOICE_EVENT, VOICE_ROOM_TYPES, VOICE_VISIBILITIES, canPublishWithRole } from "@/lib/voice/types";
import type { VoiceErrorCode } from "@/lib/voice/types";

function revalidateVoice(roomId?: string, extras: string[] = []) {
  revalidatePath("/app/voice");
  if (roomId) revalidatePath(`/app/voice/${roomId}`);
  for (const path of extras) revalidatePath(path);
}

async function notify(
  recipientId: string,
  actorId: string | null,
  type: NotificationType,
  message: string,
) {
  if (actorId && recipientId === actorId) return;
  await prisma.notification.create({
    data: { recipientId, actorId, type, message },
  });
}

async function notifyRoomLive(room: { id: string; name: string; communityId: string | null; projectId: string | null; eventId: string | null }, actorId: string) {
  const recipientIds = new Set<string>();
  const reminders = await prisma.voiceRoomReminder.findMany({
    where: { roomId: room.id },
    select: { profileId: true },
    take: 40,
  });
  for (const row of reminders) recipientIds.add(row.profileId);

  if (room.communityId) {
    const members = await prisma.communityMember.findMany({
      where: { communityId: room.communityId },
      select: { profileId: true },
      orderBy: { joinedAt: "desc" },
      take: 25,
    });
    for (const row of members) recipientIds.add(row.profileId);
  }
  if (room.projectId) {
    const members = await prisma.projectMember.findMany({
      where: { projectId: room.projectId },
      select: { profileId: true },
      take: 25,
    });
    for (const row of members) recipientIds.add(row.profileId);
  }
  if (room.eventId) {
    const regs = await prisma.eventRegistration.findMany({
      where: { eventId: room.eventId },
      select: { profileId: true },
      take: 25,
    });
    for (const row of regs) recipientIds.add(row.profileId);
  }

  for (const recipientId of recipientIds) {
    await notify(recipientId, actorId, "VOICE_LIVE", `${room.id}:${room.name}`);
  }
}

async function track(profileId: string, kind: string) {
  await prisma.analyticsEvent.create({ data: { profileId, kind } });
}

function parseType(value: string): VoiceRoomType {
  if ((VOICE_ROOM_TYPES as readonly string[]).includes(value)) return value as VoiceRoomType;
  return "PUBLIC";
}

function parseVisibility(value: string): VoiceVisibility {
  if ((VOICE_VISIBILITIES as readonly string[]).includes(value)) return value as VoiceVisibility;
  return "PUBLIC";
}

async function requireRoom(roomId: string) {
  const room = await getVoiceRoomAuth(roomId);
  if (!room) throw new VoiceError("NOT_FOUND");
  return room;
}

function resultError(error: unknown): { error: VoiceErrorCode } {
  if (error instanceof VoiceError) return { error: error.code };
  if (error instanceof Error && error.message === "UNAUTHORIZED") return { error: "UNAUTHORIZED" };
  return { error: "INVALID" };
}

export async function createVoiceRoomAction(formData: FormData) {
  const me = await requireProfile();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 3) return { error: "INVALID" as VoiceErrorCode };

  const type = parseType(String(formData.get("type") ?? "PUBLIC"));
  const visibility = parseVisibility(String(formData.get("visibility") ?? "PUBLIC"));
  const communityId = String(formData.get("communityId") ?? "").trim() || null;
  const projectId = String(formData.get("projectId") ?? "").trim() || null;
  const eventId = String(formData.get("eventId") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const schedule = String(formData.get("schedule") ?? "now");
  const scheduledRaw = String(formData.get("scheduledAt") ?? "").trim();
  const maxParticipants = Math.min(
    100,
    Math.max(2, Number(formData.get("maxParticipants") ?? 25) || 25),
  );

  const allowed = await canCreateVoiceRoom(me.id, type, { communityId, projectId, eventId });
  if (!allowed) return { error: "FORBIDDEN" as VoiceErrorCode };

  if (type === "COMMUNITY" && !communityId) return { error: "INVALID" as VoiceErrorCode };
  if (type === "PROJECT" && !projectId) return { error: "INVALID" as VoiceErrorCode };
  if (type === "EVENT" && !eventId) return { error: "INVALID" as VoiceErrorCode };

  let scheduledAt: Date | null = null;
  let status: "LIVE" | "SCHEDULED" = "LIVE";
  if (schedule !== "now" && scheduledRaw) {
    scheduledAt = new Date(scheduledRaw);
    if (Number.isNaN(scheduledAt.getTime())) return { error: "INVALID" as VoiceErrorCode };
    if (scheduledAt.getTime() > Date.now() + 60 * 1000) status = "SCHEDULED";
  }

  const room = await prisma.voiceRoom.create({
    data: {
      createdById: me.id,
      name,
      description,
      type,
      visibility: type === "PRIVATE" ? "PRIVATE" : visibility,
      status,
      communityId: type === "COMMUNITY" ? communityId : null,
      projectId: type === "PROJECT" ? projectId : null,
      eventId: type === "EVENT" ? eventId : null,
      maxParticipants,
      scheduledAt,
      startedAt: status === "LIVE" ? new Date() : null,
      lastActivityAt: new Date(),
      members: {
        create: { profileId: me.id, role: "OWNER", status: "ACTIVE" },
      },
    },
  });

  await logVoiceEvent(room.id, VOICE_EVENT.ROOM_CREATED, me.id);
  if (status === "LIVE") {
    await logVoiceEvent(room.id, VOICE_EVENT.ROOM_STARTED, me.id);
    await ensureLiveKitRoom(room.id, maxParticipants);
    await notifyRoomLive(room, me.id);
  }
  await track(me.id, "voice_hosted");
  revalidateVoice(room.id);
  redirect(`/app/voice/${room.id}`);
}

export async function startVoiceRoomAction(roomId: string) {
  try {
    const me = await requireProfile();
    const room = await requireRoom(roomId);
    if (!(await canManageVoiceRoom(room, me.id)) && !(await canModerateVoiceRoom(room, me.id))) {
      throw new VoiceError("FORBIDDEN");
    }
    if (room.status === "ENDED") throw new VoiceError("ROOM_ENDED");
    if (room.status === "LIVE") return { ok: true as const };

    await prisma.voiceRoom.update({
      where: { id: roomId },
      data: { status: "LIVE", startedAt: new Date(), lastActivityAt: new Date() },
    });
    await logVoiceEvent(roomId, VOICE_EVENT.ROOM_STARTED, me.id);
    await ensureLiveKitRoom(roomId, room.maxParticipants);
    await notifyRoomLive(room, me.id);

    revalidateVoice(roomId);
    return { ok: true as const };
  } catch (error) {
    return resultError(error);
  }
}

export async function joinVoiceRoomAction(roomId: string, asSpeaker: boolean) {
  try {
    const me = await requireProfile();
    await endAbandonedVoiceRooms();
    const room = await requireRoom(roomId);

    if (room.status === "SCHEDULED") {
      const due = !room.scheduledAt || room.scheduledAt.getTime() <= Date.now();
      if (due && (await canModerateVoiceRoom(room, me.id))) {
        await startVoiceRoomAction(roomId);
      }
    }

    const fresh = await requireRoom(roomId);
    if (!(await canJoinVoiceRoom(fresh, me.id))) {
      if (fresh.status === "ENDED") throw new VoiceError("ROOM_ENDED");
      if (fresh.locked) throw new VoiceError("ROOM_LOCKED");
      const existing = await prisma.voiceRoomMember.findUnique({
        where: { roomId_profileId: { roomId, profileId: me.id } },
      });
      if (existing?.status === "BANNED") throw new VoiceError("BANNED");
      const active = await prisma.voiceRoomMember.count({
        where: { roomId, status: "ACTIVE" },
      });
      if (active >= fresh.maxParticipants) throw new VoiceError("ROOM_FULL");
      if (fresh.status === "SCHEDULED") throw new VoiceError("ROOM_SCHEDULED");
      throw new VoiceError("FORBIDDEN");
    }

    const existing = await prisma.voiceRoomMember.findUnique({
      where: { roomId_profileId: { roomId, profileId: me.id } },
    });
    const isHost = fresh.createdById === me.id;
    const nextRole: VoiceRole = isHost
      ? "OWNER"
      : existing?.role === "MODERATOR" || existing?.role === "OWNER"
        ? existing.role
        : asSpeaker
          ? "SPEAKER"
          : "LISTENER";

    const member = await prisma.voiceRoomMember.upsert({
      where: { roomId_profileId: { roomId, profileId: me.id } },
      create: {
        roomId,
        profileId: me.id,
        role: nextRole,
        status: "ACTIVE",
        joinedAt: new Date(),
        handRaised: false,
        forceMuted: false,
      },
      update: {
        status: "ACTIVE",
        role: nextRole,
        joinedAt: new Date(),
        leftAt: null,
        handRaised: false,
      },
    });

    await logVoiceEvent(roomId, VOICE_EVENT.USER_JOINED, me.id);
    await touchRoom(roomId);
    await track(me.id, "voice_joined");
    revalidateVoice(roomId);
    return { ok: true as const, role: member.role };
  } catch (error) {
    return resultError(error);
  }
}

export async function leaveVoiceRoomAction(roomId: string) {
  try {
    const me = await requireProfile();
    const existing = await prisma.voiceRoomMember.findUnique({
      where: { roomId_profileId: { roomId, profileId: me.id } },
    });
    if (existing?.status === "ACTIVE") {
      await prisma.voiceRoomMember.update({
        where: { id: existing.id },
        data: { status: "LEFT", leftAt: new Date(), handRaised: false },
      });
      await logVoiceEvent(roomId, VOICE_EVENT.USER_LEFT, me.id);
      await touchRoom(roomId);
    }
    await endAbandonedVoiceRooms();
    revalidateVoice(roomId);
    return { ok: true as const };
  } catch (error) {
    return resultError(error);
  }
}

export async function endVoiceRoomAction(roomId: string) {
  try {
    const me = await requireProfile();
    const room = await requireRoom(roomId);
    if (!(await canModerateVoiceRoom(room, me.id))) throw new VoiceError("FORBIDDEN");
    await markRoomEnded(roomId, me.id);
    const active = await prisma.voiceRoomMember.findMany({
      where: { roomId, status: { in: ["LEFT", "ACTIVE"] } },
      select: { profileId: true },
      take: 40,
    });
    for (const row of active) {
      await notify(row.profileId, me.id, "MODERATION", `${roomId}:${room.name}`);
    }
    revalidateVoice(roomId);
    return { ok: true as const };
  } catch (error) {
    return resultError(error);
  }
}

export async function lockVoiceRoomAction(roomId: string, locked: boolean) {
  try {
    const me = await requireProfile();
    const room = await requireRoom(roomId);
    if (!(await canModerateVoiceRoom(room, me.id))) throw new VoiceError("FORBIDDEN");
    await prisma.voiceRoom.update({
      where: { id: roomId },
      data: { locked, lastActivityAt: new Date() },
    });
    await logVoiceEvent(
      roomId,
      locked ? VOICE_EVENT.ROOM_LOCKED : VOICE_EVENT.ROOM_UNLOCKED,
      me.id,
    );
    revalidateVoice(roomId);
    return { ok: true as const };
  } catch (error) {
    return resultError(error);
  }
}

export async function raiseHandAction(roomId: string, raised: boolean, targetId?: string) {
  try {
    const me = await requireProfile();
    const subjectId = targetId ?? me.id;
    if (subjectId !== me.id) {
      const room = await requireRoom(roomId);
      if (!(await canModerateVoiceRoom(room, me.id))) throw new VoiceError("FORBIDDEN");
    }
    const member = await getActiveVoiceRole(roomId, subjectId);
    if (!member) throw new VoiceError("FORBIDDEN");
    await prisma.voiceRoomMember.update({
      where: { id: member.id },
      data: { handRaised: raised },
    });
    await logVoiceEvent(
      roomId,
      raised ? VOICE_EVENT.HAND_RAISED : VOICE_EVENT.HAND_LOWERED,
      me.id,
    );
    await touchRoom(roomId);
    revalidateVoice(roomId);
    return { ok: true as const };
  } catch (error) {
    return resultError(error);
  }
}

export async function setVoiceRoleAction(roomId: string, targetId: string, role: VoiceRole) {
  try {
    const me = await requireProfile();
    if (me.id === targetId) throw new VoiceError("FORBIDDEN");
    const room = await requireRoom(roomId);
    const actor = await getActiveVoiceRole(roomId, me.id);
    if (!actor || !(await canModerateVoiceRoom(room, me.id))) throw new VoiceError("FORBIDDEN");

    const target = await prisma.voiceRoomMember.findUnique({
      where: { roomId_profileId: { roomId, profileId: targetId } },
    });
    if (!target || target.status !== "ACTIVE") throw new VoiceError("NOT_FOUND");
    assertModeratorCanChangeRole(actor.role, target.role, role);

    await prisma.voiceRoomMember.update({
      where: { id: target.id },
      data: {
        role,
        handRaised: false,
        forceMuted: role === "LISTENER" ? target.forceMuted : target.forceMuted,
      },
    });
    await updateLiveKitPublish(roomId, targetId, canPublishWithRole(role, target.forceMuted));
    await logVoiceEvent(
      roomId,
      role === "LISTENER" ? VOICE_EVENT.SPEAKER_DEMOTED : VOICE_EVENT.SPEAKER_PROMOTED,
      me.id,
      targetId,
    );
    if (role === "SPEAKER" || role === "MODERATOR") {
      await notify(targetId, me.id, "VOICE_SPEAK", `${roomId}:${room.name}`);
    }
    revalidateVoice(roomId);
    return { ok: true as const };
  } catch (error) {
    return resultError(error);
  }
}

export async function muteParticipantAction(roomId: string, targetId: string, muted: boolean) {
  try {
    const me = await requireProfile();
    const room = await requireRoom(roomId);
    if (!(await canModerateVoiceRoom(room, me.id))) throw new VoiceError("FORBIDDEN");
    const target = await getActiveVoiceRole(roomId, targetId);
    if (!target) throw new VoiceError("NOT_FOUND");
    if (target.role === "OWNER" && me.id !== room.createdById) throw new VoiceError("FORBIDDEN");

    await prisma.voiceRoomMember.update({
      where: { id: target.id },
      data: { forceMuted: muted },
    });
    if (muted) await muteLiveKitParticipant(roomId, targetId);
    await updateLiveKitPublish(roomId, targetId, canPublishWithRole(target.role, muted));
    await logVoiceEvent(roomId, VOICE_EVENT.USER_MUTED, me.id, targetId);
    revalidateVoice(roomId);
    return { ok: true as const };
  } catch (error) {
    return resultError(error);
  }
}

export async function removeParticipantAction(roomId: string, targetId: string, ban: boolean) {
  try {
    const me = await requireProfile();
    const room = await requireRoom(roomId);
    if (!(await canModerateVoiceRoom(room, me.id))) throw new VoiceError("FORBIDDEN");
    if (targetId === room.createdById) throw new VoiceError("FORBIDDEN");

    const target = await prisma.voiceRoomMember.findUnique({
      where: { roomId_profileId: { roomId, profileId: targetId } },
    });
    if (!target) throw new VoiceError("NOT_FOUND");
    const actor = await getActiveVoiceRole(roomId, me.id);
    if (actor?.role === "MODERATOR" && target.role === "MODERATOR") throw new VoiceError("FORBIDDEN");

    await prisma.voiceRoomMember.update({
      where: { id: target.id },
      data: {
        status: ban ? "BANNED" : "REMOVED",
        leftAt: new Date(),
        handRaised: false,
      },
    });
    await removeLiveKitParticipant(roomId, targetId);
    await logVoiceEvent(roomId, VOICE_EVENT.USER_REMOVED, me.id, targetId);
    revalidateVoice(roomId);
    return { ok: true as const };
  } catch (error) {
    return resultError(error);
  }
}

export async function inviteToVoiceRoomAction(roomId: string, formData: FormData) {
  try {
    const me = await requireProfile();
    const room = await requireRoom(roomId);
    if (!(await canModerateVoiceRoom(room, me.id))) throw new VoiceError("FORBIDDEN");
    const username = String(formData.get("username") ?? "")
      .replace(/^@/, "")
      .trim();
    const invitee = await prisma.profile.findFirst({ where: { username } });
    if (!invitee) throw new VoiceError("NOT_FOUND");
    await assertCanInvite(me.id, invitee.id);

    await prisma.voiceRoomInvite.upsert({
      where: { roomId_inviteeId: { roomId, inviteeId: invitee.id } },
      create: { roomId, inviterId: me.id, inviteeId: invitee.id, status: "PENDING" },
      update: { status: "PENDING", inviterId: me.id, respondedAt: null },
    });
    await notify(invitee.id, me.id, "VOICE_INVITE", `${roomId}:${room.name}`);
    revalidateVoice(roomId);
    return { ok: true as const };
  } catch (error) {
    return resultError(error);
  }
}

export async function respondVoiceInviteAction(id: string, status: "ACCEPTED" | "REJECTED") {
  const me = await requireProfile();
  const invite = await prisma.voiceRoomInvite.findUnique({ where: { id } });
  if (!invite || invite.inviteeId !== me.id || invite.status !== "PENDING") return;
  await prisma.voiceRoomInvite.update({
    where: { id },
    data: { status, respondedAt: new Date() },
  });
  revalidatePath("/app/voice");
  if (status === "ACCEPTED") redirect(`/app/voice/${invite.roomId}`);
}

export async function setVoiceReminderAction(roomId: string, enabled: boolean) {
  try {
    const me = await requireProfile();
    const room = await requireRoom(roomId);
    const { canViewVoiceRoom } = await import("@/lib/voice/access");
    if (!(await canViewVoiceRoom(room, me.id))) throw new VoiceError("FORBIDDEN");
    if (enabled) {
      await prisma.voiceRoomReminder.upsert({
        where: { roomId_profileId: { roomId, profileId: me.id } },
        create: { roomId, profileId: me.id },
        update: {},
      });
    } else {
      await prisma.voiceRoomReminder.deleteMany({ where: { roomId, profileId: me.id } });
    }
    revalidateVoice(roomId);
    return { ok: true as const };
  } catch (error) {
    return resultError(error);
  }
}

export async function refreshVoiceMaintenance() {
  await endAbandonedVoiceRooms();
  await fireDueVoiceReminders();
}
