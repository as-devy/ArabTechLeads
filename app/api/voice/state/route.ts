import { auth } from "@/auth";
import { getCurrentProfile } from "@/lib/auth/session";
import { canViewVoiceRoom, getVoiceRoomAuth } from "@/lib/voice/access";
import { endAbandonedVoiceRooms } from "@/lib/voice/lifecycle";
import { loadVoiceRoomState } from "@/lib/voice/queries";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const roomId = new URL(request.url).searchParams.get("roomId") ?? "";
  if (!roomId) {
    return Response.json({ error: "INVALID" }, { status: 400 });
  }

  await endAbandonedVoiceRooms();
  const room = await getVoiceRoomAuth(roomId);
  if (!room) {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (!(await canViewVoiceRoom(room, profile.id))) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const state = await loadVoiceRoomState(roomId, profile.id);
  return Response.json({ state });
}
