import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { VoiceRoomCard } from "@/components/voice/voice-room-card";
import { RealtimeRefresher } from "@/components/realtime/realtime-refresher";
import { getCurrentProfile } from "@/lib/auth/session";
import { refreshVoiceMaintenance, respondVoiceInviteAction } from "@/lib/actions/voice";
import { prismaModel } from "@/lib/prisma";
import { isLiveKitConfigured } from "@/lib/voice/config";
import { listVoiceRooms } from "@/lib/voice/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function VoiceDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.voice");
  const loc = await getLocale();

  await refreshVoiceMaintenance();

  const invitations = prismaModel<{
    findMany: (args: unknown) => Promise<
      Array<{
        id: string;
        room: { name: string };
        inviter: { fullName: string | null };
      }>
    >;
  }>("voiceRoomInvite");

  const [live, upcoming, yours, community, project, invites] = await Promise.all([
    listVoiceRooms(me.id, { status: "LIVE" }),
    listVoiceRooms(me.id, { status: "SCHEDULED" }),
    listVoiceRooms(me.id, { createdById: me.id, status: { in: ["LIVE", "SCHEDULED"] } }),
    listVoiceRooms(me.id, { type: "COMMUNITY", status: { in: ["LIVE", "SCHEDULED"] } }),
    listVoiceRooms(me.id, { type: "PROJECT", status: { in: ["LIVE", "SCHEDULED"] } }),
    invitations?.findMany
      ? invitations.findMany({
          where: { inviteeId: me.id, status: "PENDING" },
          include: { room: true, inviter: true },
          take: 10,
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  const sections = [
    { key: "liveNow", rooms: live },
    { key: "upcoming", rooms: upcoming },
    { key: "yourRooms", rooms: yours },
    { key: "communityRooms", rooms: community },
    { key: "projectRooms", rooms: project },
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <RealtimeRefresher tables={["voice_rooms", "voice_room_members", "voice_room_invites"]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-secondary">{t("subtitle")}</p>
        </div>
        <Link href="/app/voice/create">
          <Button>{t("create")}</Button>
        </Link>
      </div>
      {!isLiveKitConfigured() ? (
        <p className="mt-4 rounded-xl border border-border bg-accent-muted/40 p-3 text-sm text-secondary">
          {t("livekitMissing")}
        </p>
      ) : null}
      {invites.length > 0 ? (
        <section className="mt-6 space-y-2">
          <h2 className="text-sm font-semibold">{t("invites")}</h2>
          {invites.map((invite) => (
            <article key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
              <p className="text-sm">
                {invite.inviter.fullName} · {invite.room.name}
              </p>
              <div className="flex gap-2">
                <form action={respondVoiceInviteAction.bind(null, invite.id, "ACCEPTED")}>
                  <Button size="sm">{t("accept")}</Button>
                </form>
                <form action={respondVoiceInviteAction.bind(null, invite.id, "REJECTED")}>
                  <Button size="sm" variant="secondary">
                    {t("decline")}
                  </Button>
                </form>
              </div>
            </article>
          ))}
        </section>
      ) : null}
      {sections.map((section) => (
        <section key={section.key} className="mt-8">
          <h2 className="text-sm font-semibold">{t(section.key)}</h2>
          {section.rooms.length === 0 ? (
            <p className="mt-3 text-sm text-secondary">{t("empty")}</p>
          ) : (
            <div className="mt-3 grid gap-3">
              {section.rooms.map((room) => (
                <VoiceRoomCard
                  key={room.id}
                  room={room}
                  locale={loc}
                  parentLabel={
                    loc.startsWith("ar")
                      ? room.community?.nameAr || room.project?.name || room.event?.title
                      : room.community?.nameEn || room.project?.name || room.event?.title
                  }
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
