import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { CreateVoiceRoomForm } from "@/components/voice/create-voice-room-form";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { VoiceRoomType } from "@/lib/voice/types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ community?: string; project?: string; event?: string; type?: string }>;
};

export default async function CreateVoiceRoomPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.voice");
  const loc = await getLocale();

  const [communities, projects, events] = await Promise.all([
    prisma.community.findMany({
      where: { members: { some: { profileId: me.id } } },
      select: { id: true, nameAr: true, nameEn: true },
      orderBy: { nameEn: "asc" },
    }),
    prisma.project.findMany({
      where: { members: { some: { profileId: me.id } } },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.event.findMany({
      where: { organizerId: me.id, startAt: { gte: new Date(Date.now() - 86400000) } },
      select: { id: true, title: true },
      orderBy: { startAt: "asc" },
      take: 50,
    }),
  ]);

  const initialType = (["COMMUNITY", "PROJECT", "EVENT", "PUBLIC", "PRIVATE"] as const).includes(
    query.type as VoiceRoomType,
  )
    ? (query.type as VoiceRoomType)
    : query.community
      ? "COMMUNITY"
      : query.project
        ? "PROJECT"
        : query.event
          ? "EVENT"
          : "PUBLIC";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <Link href="/app/voice" className="text-sm text-muted">
        ← {t("title")}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">{t("create")}</h1>
      <p className="mt-1 text-sm text-secondary">{t("createIntro")}</p>
      <div className="mt-6">
        <CreateVoiceRoomForm
          communities={communities.map((c) => ({
            id: c.id,
            label: loc.startsWith("ar") ? c.nameAr : c.nameEn,
          }))}
          projects={projects.map((p) => ({ id: p.id, label: p.name }))}
          events={events.map((e) => ({ id: e.id, label: e.title }))}
          initialType={initialType}
          initialCommunityId={query.community}
          initialProjectId={query.project}
          initialEventId={query.event}
        />
      </div>
    </div>
  );
}
