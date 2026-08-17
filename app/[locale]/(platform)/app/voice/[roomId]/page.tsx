import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { VoiceRoomExperience } from "@/components/voice/voice-room-ui";
import { getCurrentProfile } from "@/lib/auth/session";
import { canViewVoiceRoom, getVoiceRoomAuth } from "@/lib/voice/access";
import { isLiveKitConfigured } from "@/lib/voice/config";
import { endAbandonedVoiceRooms } from "@/lib/voice/lifecycle";
import { loadVoiceRoomState } from "@/lib/voice/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; roomId: string }>;
};

export default async function VoiceRoomPage({ params }: Props) {
  const { locale, roomId } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  await endAbandonedVoiceRooms();
  const room = await getVoiceRoomAuth(roomId);
  if (!room) notFound();
  if (!(await canViewVoiceRoom(room, me.id))) notFound();

  const state = await loadVoiceRoomState(roomId, me.id);
  if (!state) notFound();

  return (
    <VoiceRoomExperience
      initial={state}
      profileId={me.id}
      livekitConfigured={isLiveKitConfigured()}
      locale={locale}
    />
  );
}
