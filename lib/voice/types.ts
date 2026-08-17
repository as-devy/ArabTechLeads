import type {
  VoiceMemberStatus,
  VoiceRole,
  VoiceRoomStatus,
  VoiceRoomType,
  VoiceVisibility,
} from "@/lib/generated/prisma/client";

export type {
  VoiceMemberStatus,
  VoiceRole,
  VoiceRoomStatus,
  VoiceRoomType,
  VoiceVisibility,
};

export const VOICE_ROOM_TYPES = [
  "COMMUNITY",
  "PROJECT",
  "EVENT",
  "PUBLIC",
  "PRIVATE",
] as const;

export const VOICE_VISIBILITIES = ["PUBLIC", "COMMUNITY", "MEMBERS", "PRIVATE"] as const;

export const SPEAKING_ROLES: VoiceRole[] = ["OWNER", "MODERATOR", "SPEAKER"];

export const MODERATOR_ROLES: VoiceRole[] = ["OWNER", "MODERATOR"];

export function livekitRoomName(roomId: string) {
  return `atl-${roomId}`;
}

export function canPublishWithRole(role: VoiceRole, forceMuted: boolean) {
  return SPEAKING_ROLES.includes(role) && !forceMuted;
}

export type VoiceProfilePreview = {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  githubUrl?: string | null;
  isAdmin?: boolean;
};

export type VoiceMemberPreview = {
  id: string;
  profileId: string;
  role: VoiceRole;
  status: VoiceMemberStatus;
  handRaised: boolean;
  forceMuted: boolean;
  joinedAt: string;
  profile: VoiceProfilePreview;
};

export type VoiceRoomParent = {
  community?: { id: string; slug: string; nameAr: string; nameEn: string } | null;
  project?: { id: string; slug: string; name: string } | null;
  event?: { id: string; slug: string; title: string } | null;
};

export type VoiceRoomCardData = VoiceRoomParent & {
  id: string;
  name: string;
  description: string | null;
  type: VoiceRoomType;
  visibility: VoiceVisibility;
  status: VoiceRoomStatus;
  locked: boolean;
  maxParticipants: number;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdBy: VoiceProfilePreview;
  participantCount: number;
  previews: VoiceProfilePreview[];
};

export type VoiceRoomState = VoiceRoomCardData & {
  members: VoiceMemberPreview[];
  myRole: VoiceRole | null;
  myStatus: VoiceMemberStatus | null;
  myHandRaised: boolean;
  reminderSet: boolean;
};

export const VOICE_EVENT = {
  ROOM_CREATED: "room_created",
  ROOM_STARTED: "room_started",
  ROOM_ENDED: "room_ended",
  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
  SPEAKER_PROMOTED: "speaker_promoted",
  SPEAKER_DEMOTED: "speaker_demoted",
  HAND_RAISED: "hand_raised",
  HAND_LOWERED: "hand_lowered",
  USER_REMOVED: "user_removed",
  USER_MUTED: "user_muted",
  ROOM_LOCKED: "room_locked",
  ROOM_UNLOCKED: "room_unlocked",
} as const;

export type VoiceErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "ROOM_ENDED"
  | "ROOM_LOCKED"
  | "ROOM_FULL"
  | "ROOM_SCHEDULED"
  | "BANNED"
  | "LIVEKIT_NOT_CONFIGURED"
  | "TOKEN_FAILED"
  | "CONNECTION_FAILED"
  | "INVALID"
  | "BLOCKED";
