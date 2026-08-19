import { getLocale, getTranslations } from "next-intl/server";
import { VoiceRoomCard } from "@/components/voice/voice-room-card";
import { RealtimeRefresher } from "@/components/realtime/realtime-refresher";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { VoiceRoomCardData } from "@/lib/voice/types";

export async function VoiceRoomsSection({
  rooms,
  createHref,
}: {
  rooms: VoiceRoomCardData[];
  createHref?: string;
}) {
  const t = await getTranslations("app.voice");
  const locale = await getLocale();

  return (
    <div className="mt-4 space-y-3">
      <RealtimeRefresher tables={["voice_rooms", "voice_room_members"]} />
      {createHref ? (
        <Link href={createHref as never}>
          <Button size="sm">{t("create")}</Button>
        </Link>
      ) : null}
      {rooms.length === 0 ? <p className="text-sm text-secondary">{t("empty")}</p> : null}
      <div className="grid gap-3">
        {rooms.map((room) => (
          <VoiceRoomCard
            key={room.id}
            room={room}
            locale={locale}
            parentLabel={
              locale.startsWith("ar")
                ? room.community?.nameAr || room.project?.name || room.event?.title
                : room.community?.nameEn || room.project?.name || room.event?.title
            }
          />
        ))}
      </div>
    </div>
  );
}
