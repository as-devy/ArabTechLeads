import { prisma, prismaModel } from "@/lib/prisma";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { deleteLiveKitRoom } from "@/lib/voice/livekit-server";
import { VOICE_EVENT } from "@/lib/voice/types";
import { EMPTY_ROOM_TIMEOUT_MS } from "@/lib/voice/queries";

function rooms() {
  return prismaModel<PrismaClient["voiceRoom"]>("voiceRoom");
}

function members() {
  return prismaModel<PrismaClient["voiceRoomMember"]>("voiceRoomMember");
}

function events() {
  return prismaModel<PrismaClient["voiceRoomEvent"]>("voiceRoomEvent");
}

function reminders() {
  return prismaModel<PrismaClient["voiceRoomReminder"]>("voiceRoomReminder");
}

export async function logVoiceEvent(
  roomId: string,
  type: string,
  actorId?: string | null,
  payload?: string | null,
) {
  const model = events();
  if (!model?.create) return;
  await model.create({
    data: { roomId, type, actorId: actorId ?? null, payload: payload ?? null },
  });
}

export async function markRoomEnded(roomId: string, actorId?: string | null) {
  const model = rooms();
  const memberModel = members();
  if (!model?.findUnique || !model.update) return null;
  const room = await model.findUnique({ where: { id: roomId } });
  if (!room || room.status === "ENDED") return room;
  const updated = await model.update({
    where: { id: roomId },
    data: { status: "ENDED", endedAt: new Date(), locked: true, lastActivityAt: new Date() },
  });
  if (memberModel?.updateMany) {
    await memberModel.updateMany({
      where: { roomId, status: "ACTIVE" },
      data: { status: "LEFT", leftAt: new Date(), handRaised: false },
    });
  }
  await logVoiceEvent(roomId, VOICE_EVENT.ROOM_ENDED, actorId);
  await deleteLiveKitRoom(roomId);
  return updated;
}

export async function endAbandonedVoiceRooms() {
  const model = rooms();
  if (!model?.findMany) return;
  const cutoff = new Date(Date.now() - EMPTY_ROOM_TIMEOUT_MS);
  const stale = await model.findMany({
    where: {
      status: "LIVE",
      lastActivityAt: { lt: cutoff },
      members: { none: { status: "ACTIVE" } },
    },
    select: { id: true },
    take: 20,
  });
  for (const room of stale) {
    await markRoomEnded(room.id, null);
  }
}

export async function fireDueVoiceReminders() {
  const model = reminders();
  if (!model?.findMany || !model.update) return;
  const now = new Date();
  const soon = new Date(now.getTime() + 15 * 60 * 1000);
  const due = await model.findMany({
    where: {
      notifiedAt: null,
      room: {
        status: "SCHEDULED",
        scheduledAt: { gte: now, lte: soon },
      },
    },
    include: { room: { select: { id: true, name: true } } },
    take: 40,
  });

  for (const reminder of due) {
    await prisma.notification.create({
      data: {
        recipientId: reminder.profileId,
        type: "VOICE_REMINDER",
        message: `${reminder.room.id}:${reminder.room.name}`,
      },
    });
    await model.update({
      where: { id: reminder.id },
      data: { notifiedAt: now },
    });
  }
}

export async function touchRoom(roomId: string) {
  const model = rooms();
  if (!model?.update) return;
  await model.update({
    where: { id: roomId },
    data: { lastActivityAt: new Date() },
  });
}
