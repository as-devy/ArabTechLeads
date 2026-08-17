import { prisma } from "@/lib/prisma";
import { isBlockedPair } from "@/lib/trust/moderation";
import type {
  VoiceErrorCode,
  VoiceRole,
  VoiceRoomType,
  VoiceVisibility,
} from "@/lib/voice/types";
import { MODERATOR_ROLES } from "@/lib/voice/types";

export class VoiceError extends Error {
  constructor(public code: VoiceErrorCode) {
    super(code);
    this.name = "VoiceError";
  }
}

export type VoiceRoomAuth = {
  id: string;
  name: string;
  createdById: string;
  communityId: string | null;
  projectId: string | null;
  eventId: string | null;
  type: VoiceRoomType;
  visibility: VoiceVisibility;
  status: "SCHEDULED" | "LIVE" | "ENDED";
  locked: boolean;
  maxParticipants: number;
  scheduledAt: Date | null;
};

type MembershipSnapshot = {
  role: VoiceRole | null;
  status: "ACTIVE" | "LEFT" | "REMOVED" | "BANNED" | null;
  invited: boolean;
  communityMember: boolean;
  projectMember: boolean;
  eventAccess: boolean;
  isAdmin: boolean;
};

export async function getVoiceRoomAuth(roomId: string) {
  const room = await prisma.voiceRoom.findUnique({ where: { id: roomId } });
  if (!room) return null;
  return room as VoiceRoomAuth;
}

async function membershipSnapshot(room: VoiceRoomAuth, profileId: string): Promise<MembershipSnapshot> {
  const [member, invite, communityMember, projectMember, eventRow, profile] = await Promise.all([
    prisma.voiceRoomMember.findUnique({
      where: { roomId_profileId: { roomId: room.id, profileId } },
      select: { role: true, status: true },
    }),
    prisma.voiceRoomInvite.findUnique({
      where: { roomId_inviteeId: { roomId: room.id, inviteeId: profileId } },
      select: { status: true },
    }),
    room.communityId
      ? prisma.communityMember.findUnique({
          where: { communityId_profileId: { communityId: room.communityId, profileId } },
          select: { profileId: true },
        })
      : null,
    room.projectId
      ? prisma.projectMember.findUnique({
          where: { projectId_profileId: { projectId: room.projectId, profileId } },
          select: { profileId: true },
        })
      : null,
    room.eventId
      ? prisma.event.findUnique({
          where: { id: room.eventId },
          select: {
            organizerId: true,
            registrations: { where: { profileId }, select: { profileId: true } },
          },
        })
      : null,
    prisma.profile.findUnique({ where: { id: profileId }, select: { isAdmin: true } }),
  ]);

  return {
    role: member?.role ?? null,
    status: member?.status ?? null,
    invited: invite?.status === "PENDING" || invite?.status === "ACCEPTED",
    communityMember: Boolean(communityMember),
    projectMember: Boolean(projectMember),
    eventAccess: Boolean(
      eventRow && (eventRow.organizerId === profileId || eventRow.registrations.length > 0),
    ),
    isAdmin: Boolean(profile?.isAdmin),
  };
}

export async function canViewVoiceRoom(room: VoiceRoomAuth, profileId: string) {
  const snap = await membershipSnapshot(room, profileId);
  if (snap.isAdmin) return true;
  if (room.createdById === profileId) return true;
  if (snap.status && snap.status !== "BANNED") return true;
  if (snap.invited) return true;

  if (room.visibility === "PUBLIC") return true;
  if (room.visibility === "COMMUNITY") return snap.communityMember;
  if (room.visibility === "MEMBERS") {
    return snap.communityMember || snap.projectMember || snap.eventAccess;
  }
  return false;
}

export async function canJoinVoiceRoom(room: VoiceRoomAuth, profileId: string) {
  if (room.status === "ENDED") return false;
  const snap = await membershipSnapshot(room, profileId);
  if (snap.status === "BANNED") return false;
  if (!(await canViewVoiceRoom(room, profileId))) return false;
  if (snap.status === "ACTIVE") return true;
  if (room.locked) return false;

  const active = await prisma.voiceRoomMember.count({
    where: { roomId: room.id, status: "ACTIVE" },
  });
  if (active >= room.maxParticipants) return false;

  if (room.status === "SCHEDULED") {
    if (room.scheduledAt && room.scheduledAt > new Date()) return false;
  }

  if (room.visibility === "PRIVATE" || room.type === "PRIVATE") {
    return room.createdById === profileId || snap.invited || snap.isAdmin;
  }

  return true;
}

export async function canCreateVoiceRoom(
  profileId: string,
  type: VoiceRoomType,
  parent: { communityId?: string | null; projectId?: string | null; eventId?: string | null },
) {
  if (type === "PUBLIC" || type === "PRIVATE") return true;
  if (type === "COMMUNITY") {
    if (!parent.communityId) return false;
    const row = await prisma.communityMember.findUnique({
      where: { communityId_profileId: { communityId: parent.communityId, profileId } },
    });
    return Boolean(row);
  }
  if (type === "PROJECT") {
    if (!parent.projectId) return false;
    const row = await prisma.projectMember.findUnique({
      where: { projectId_profileId: { projectId: parent.projectId, profileId } },
    });
    return Boolean(row);
  }
  if (type === "EVENT") {
    if (!parent.eventId) return false;
    const event = await prisma.event.findUnique({ where: { id: parent.eventId } });
    return event?.organizerId === profileId;
  }
  return false;
}

export async function getActiveVoiceRole(roomId: string, profileId: string) {
  const member = await prisma.voiceRoomMember.findUnique({
    where: { roomId_profileId: { roomId, profileId } },
  });
  if (!member || member.status !== "ACTIVE") return null;
  return member;
}

export async function canModerateVoiceRoom(room: VoiceRoomAuth, profileId: string) {
  if (room.createdById === profileId) return true;
  const member = await getActiveVoiceRole(room.id, profileId);
  return Boolean(member && MODERATOR_ROLES.includes(member.role));
}

export async function canManageVoiceRoom(room: VoiceRoomAuth, profileId: string) {
  if (room.createdById === profileId) return true;
  const member = await getActiveVoiceRole(room.id, profileId);
  return member?.role === "OWNER";
}

export async function canGenerateVoiceToken(room: VoiceRoomAuth, profileId: string) {
  return canJoinVoiceRoom(room, profileId);
}

export async function assertCanInvite(inviterId: string, inviteeId: string) {
  if (inviterId === inviteeId) throw new VoiceError("INVALID");
  if (await isBlockedPair(inviterId, inviteeId)) throw new VoiceError("BLOCKED");
}

export function assertModeratorCanChangeRole(
  actorRole: VoiceRole,
  targetRole: VoiceRole,
  nextRole: VoiceRole,
) {
  if (targetRole === "OWNER") throw new VoiceError("FORBIDDEN");
  if (actorRole === "MODERATOR" && targetRole === "MODERATOR" && nextRole !== "MODERATOR") {
    throw new VoiceError("FORBIDDEN");
  }
  if (actorRole !== "OWNER" && nextRole === "OWNER") throw new VoiceError("FORBIDDEN");
  if (actorRole === "MODERATOR" && nextRole === "MODERATOR") throw new VoiceError("FORBIDDEN");
}
