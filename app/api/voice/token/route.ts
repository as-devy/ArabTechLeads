import { auth } from "@/auth";
import { getCurrentProfile } from "@/lib/auth/session";
import { prismaModel } from "@/lib/prisma";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { canGenerateVoiceToken, getVoiceRoomAuth } from "@/lib/voice/access";
import { isLiveKitConfigured, getLiveKitPublicUrl } from "@/lib/voice/config";
import { endAbandonedVoiceRooms } from "@/lib/voice/lifecycle";
import { createLiveKitAccessToken, ensureLiveKitRoom } from "@/lib/voice/livekit-server";
import { canPublishWithRole } from "@/lib/voice/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const profile = await getCurrentProfile();
  if (!profile || profile.suspendedAt) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let roomId = "";
  try {
    const body = (await request.json()) as { roomId?: unknown };
    roomId = typeof body.roomId === "string" ? body.roomId : "";
  } catch {
    return Response.json({ error: "INVALID" }, { status: 400 });
  }
  if (!roomId) {
    return Response.json({ error: "INVALID" }, { status: 400 });
  }

  await endAbandonedVoiceRooms();
  const room = await getVoiceRoomAuth(roomId);
  if (!room) {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (!(await canGenerateVoiceToken(room, profile.id))) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (!isLiveKitConfigured()) {
    return Response.json({ error: "LIVEKIT_NOT_CONFIGURED" }, { status: 503 });
  }

  const members = prismaModel<PrismaClient["voiceRoomMember"]>("voiceRoomMember");
  const member = members?.findUnique
    ? await members.findUnique({
        where: { roomId_profileId: { roomId, profileId: profile.id } },
      })
    : null;
  const role = member?.status === "ACTIVE" ? member.role : "LISTENER";
  const forceMuted = member?.status === "ACTIVE" ? member.forceMuted : false;

  try {
    await ensureLiveKitRoom(roomId, room.maxParticipants);
    const token = await createLiveKitAccessToken({
      roomId,
      identity: profile.id,
      name: profile.fullName || profile.username || "Developer",
      canPublish: canPublishWithRole(role, forceMuted),
    });
    return Response.json({
      token,
      url: getLiveKitPublicUrl(),
      identity: profile.id,
      role,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "TOKEN_FAILED";
    console.error("LiveKit token generation failed", message);
    return Response.json(
      { error: message === "LIVEKIT_NOT_CONFIGURED" ? "LIVEKIT_NOT_CONFIGURED" : "TOKEN_FAILED" },
      { status: message === "LIVEKIT_NOT_CONFIGURED" ? 503 : 500 },
    );
  }
}
