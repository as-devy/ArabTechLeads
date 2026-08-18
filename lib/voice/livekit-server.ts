import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import {
  getLiveKitApiKey,
  getLiveKitApiSecret,
  isLiveKitConfigured,
  livekitHttpUrl,
} from "@/lib/voice/config";
import { livekitRoomName } from "@/lib/voice/types";

const TOKEN_TTL = "1h";
const EMPTY_TIMEOUT_SECONDS = 600;

function roomService() {
  if (!isLiveKitConfigured()) return null;
  return new RoomServiceClient(livekitHttpUrl(), getLiveKitApiKey(), getLiveKitApiSecret());
}

function publishSources(canSpeak: boolean) {
  const sources = [TrackSource.CAMERA, TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO];
  if (canSpeak) sources.push(TrackSource.MICROPHONE);
  return sources;
}

export async function createLiveKitAccessToken(input: {
  roomId: string;
  identity: string;
  name: string;
  canPublish: boolean;
}) {
  if (!isLiveKitConfigured()) {
    throw new Error("LIVEKIT_NOT_CONFIGURED");
  }

  const at = new AccessToken(getLiveKitApiKey(), getLiveKitApiSecret(), {
    identity: input.identity,
    name: input.name,
    ttl: TOKEN_TTL,
  });

  at.addGrant({
    roomJoin: true,
    roomCreate: true,
    room: livekitRoomName(input.roomId),
    canPublish: true,
    canPublishSources: publishSources(input.canPublish),
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
  });

  const token = await at.toJwt();
  if (typeof token !== "string" || token.split(".").length !== 3) {
    throw new Error("TOKEN_FAILED");
  }
  return token;
}

export async function ensureLiveKitRoom(roomId: string, maxParticipants: number) {
  const svc = roomService();
  if (!svc) return;
  try {
    await svc.createRoom({
      name: livekitRoomName(roomId),
      maxParticipants,
      emptyTimeout: EMPTY_TIMEOUT_SECONDS,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists|conflict|409/i.test(message)) {
      console.error("LiveKit createRoom failed", message);
    }
  }
}

export async function updateLiveKitPublish(roomId: string, identity: string, canPublish: boolean) {
  const svc = roomService();
  if (!svc) return;
  try {
    await svc.updateParticipant(livekitRoomName(roomId), identity, {
      permission: {
        canPublish: true,
        canPublishSources: publishSources(canPublish),
        canSubscribe: true,
        canPublishData: true,
      },
    });
  } catch {
    // Participant may not be connected yet.
  }
}

export async function removeLiveKitParticipant(roomId: string, identity: string) {
  const svc = roomService();
  if (!svc) return;
  try {
    await svc.removeParticipant(livekitRoomName(roomId), identity);
  } catch {
    // Already gone.
  }
}

export async function muteLiveKitParticipant(roomId: string, identity: string) {
  const svc = roomService();
  if (!svc) return;
  try {
    const participant = await svc.getParticipant(livekitRoomName(roomId), identity);
    for (const track of participant.tracks) {
      if (track.sid) {
        await svc.mutePublishedTrack(livekitRoomName(roomId), identity, track.sid, true);
      }
    }
  } catch {
    await updateLiveKitPublish(roomId, identity, false);
  }
}

export async function deleteLiveKitRoom(roomId: string) {
  const svc = roomService();
  if (!svc) return;
  try {
    await svc.deleteRoom(livekitRoomName(roomId));
  } catch {
    // Room already empty/deleted.
  }
}
