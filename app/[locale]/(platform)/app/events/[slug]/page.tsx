import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { registerEventAction, unregisterEventAction } from "@/lib/actions/opportunities";
import { prisma } from "@/lib/prisma";
import { listVoiceRooms } from "@/lib/voice/queries";
import { VoiceRoomsSection } from "@/components/voice/voice-rooms-section";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function EventDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");
  const event = await prisma.event.findUnique({
    where: { slug },
    include: { organizer: true, registrations: { where: { profileId: me.id } } },
  });
  if (!event) notFound();
  const registered = event.registrations.length > 0;
  const voiceRooms = await listVoiceRooms(me.id, { eventId: event.id });
  const isOrganizer = event.organizerId === me.id;
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/app/events" className="text-sm text-muted">← {t("events")}</Link>
      <h1 className="mt-3 text-2xl font-semibold">{event.title}</h1>
      <p className="mt-2 text-sm text-secondary">{event.startAt.toISOString().slice(0, 16).replace("T", " ")}</p>
      <p className="mt-4 text-sm leading-7">{event.description}</p>
      {registered ? (
        <form action={unregisterEventAction.bind(null, event.id)} className="mt-6"><Button variant="secondary">{t("unregister")}</Button></form>
      ) : (
        <form action={registerEventAction.bind(null, event.id)} className="mt-6"><Button>{t("register")}</Button></form>
      )}
      <section className="mt-8">
        <h2 className="text-sm font-semibold">{t("voiceRoom")}</h2>
        <VoiceRoomsSection
          rooms={voiceRooms}
          createHref={isOrganizer ? `/app/voice/create?event=${event.id}&type=EVENT` : undefined}
        />
      </section>
    </div>
  );
}
