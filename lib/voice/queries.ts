import { prismaModel } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import type { VoiceRoomCardData, VoiceRoomState } from "@/lib/voice/types";

export const EMPTY_ROOM_TIMEOUT_MS = 10 * 60 * 1000;

export const voiceRoomInclude = {
  createdBy: {
    select: {
      id: true,
      username: true,
      fullName: true,
      avatarUrl: true,
      githubUrl: true,
      isAdmin: true,
    },
  },
  community: { select: { id: true, slug: true, nameAr: true, nameEn: true } },
  project: { select: { id: true, slug: true, name: true } },
  event: { select: { id: true, slug: true, title: true } },
  members: {
    where: { status: "ACTIVE" as const },
    orderBy: { joinedAt: "asc" as const },
    include: {
      profile: {
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
          githubUrl: true,
          isAdmin: true,
        },
      },
    },
  },
} satisfies Prisma.VoiceRoomInclude;

export function visibleRoomWhere(profileId: string): Prisma.VoiceRoomWhereInput {
  return {
    OR: [
      { visibility: "PUBLIC" },
      { createdById: profileId },
      { members: { some: { profileId } } },
      {
        invites: {
          some: { inviteeId: profileId, status: { in: ["PENDING", "ACCEPTED"] } },
        },
      },
      { community: { members: { some: { profileId } } } },
      { project: { members: { some: { profileId } } } },
      {
        event: {
          OR: [{ organizerId: profileId }, { registrations: { some: { profileId } } }],
        },
      },
    ],
  };
}

type LoadedRoom = Prisma.VoiceRoomGetPayload<{ include: typeof voiceRoomInclude }>;

function voiceRooms() {
  return prismaModel<PrismaClient["voiceRoom"]>("voiceRoom");
}

function voiceMembers() {
  return prismaModel<PrismaClient["voiceRoomMember"]>("voiceRoomMember");
}

function voiceReminders() {
  return prismaModel<PrismaClient["voiceRoomReminder"]>("voiceRoomReminder");
}

export function toCardData(room: LoadedRoom): VoiceRoomCardData {
  return {
    id: room.id,
    name: room.name,
    description: room.description,
    type: room.type,
    visibility: room.visibility,
    status: room.status,
    locked: room.locked,
    maxParticipants: room.maxParticipants,
    scheduledAt: room.scheduledAt?.toISOString() ?? null,
    startedAt: room.startedAt?.toISOString() ?? null,
    endedAt: room.endedAt?.toISOString() ?? null,
    createdBy: room.createdBy,
    community: room.community,
    project: room.project,
    event: room.event,
    participantCount: room.members.length,
    previews: room.members.slice(0, 5).map((m) => m.profile),
  };
}

export async function loadVoiceRoomState(
  roomId: string,
  profileId: string,
): Promise<VoiceRoomState | null> {
  const model = voiceRooms();
  if (!model?.findUnique) return null;
  const room = await model.findUnique({
    where: { id: roomId },
    include: voiceRoomInclude,
  });
  if (!room) return null;

  const memberModel = voiceMembers();
  const reminderModel = voiceReminders();
  const [mine, reminder] = await Promise.all([
    memberModel?.findUnique
      ? memberModel.findUnique({
          where: { roomId_profileId: { roomId, profileId } },
        })
      : null,
    reminderModel?.findUnique
      ? reminderModel.findUnique({
          where: { roomId_profileId: { roomId, profileId } },
        })
      : null,
  ]);

  return {
    ...toCardData(room),
    members: room.members.map((m) => ({
      id: m.id,
      profileId: m.profileId,
      role: m.role,
      status: m.status,
      handRaised: m.handRaised,
      forceMuted: m.forceMuted,
      joinedAt: m.joinedAt.toISOString(),
      profile: m.profile,
    })),
    myRole: mine?.status === "ACTIVE" ? mine.role : null,
    myStatus: mine?.status ?? null,
    myHandRaised: Boolean(mine?.handRaised && mine.status === "ACTIVE"),
    reminderSet: Boolean(reminder),
  };
}

export async function listVoiceRooms(
  profileId: string,
  extra: Prisma.VoiceRoomWhereInput = {},
) {
  const model = voiceRooms();
  if (!model?.findMany) return [];
  const rooms = await model.findMany({
    where: { AND: [visibleRoomWhere(profileId), extra] },
    include: voiceRoomInclude,
    orderBy: [{ status: "asc" }, { scheduledAt: "asc" }, { createdAt: "desc" }],
    take: 60,
  });
  return rooms.map(toCardData);
}
