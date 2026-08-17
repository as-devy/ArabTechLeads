import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ range?: string }>;
};

function windowFor(range: string) {
  const days = { "7": 7, "30": 30, "90": 90, "365": 365 }[range];
  if (!days) return null;
  return new Date(Date.now() - days * 86400000);
}

export default async function AnalyticsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { range = "30" } = await searchParams;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.stage5");
  const from = windowFor(range);
  const prevFrom = from ? new Date(from.getTime() - (Date.now() - from.getTime())) : null;

  const whereNow = from ? { profileId: me.id, createdAt: { gte: from } } : { profileId: me.id };
  const wherePrev =
    from && prevFrom
      ? { profileId: me.id, createdAt: { gte: prevFrom, lt: from } }
      : null;

  const [views, prevViews, followers, memberships, applications, proposals, sessions, voiceHosted, voiceJoined] =
    await Promise.all([
      prisma.analyticsEvent.count({ where: { ...whereNow, kind: "profile_view" } }),
      wherePrev
        ? prisma.analyticsEvent.count({ where: { ...wherePrev, kind: "profile_view" } })
        : 0,
      prisma.follow.count({ where: { followingId: me.id } }),
      prisma.projectMember.count({ where: { profileId: me.id } }),
      prisma.jobApplication.count({ where: { profileId: me.id } }),
      prisma.freelanceProposal.count({ where: { profileId: me.id } }),
      prisma.mentorshipRequest.count({
        where: { OR: [{ mentorId: me.id }, { menteeId: me.id }], status: "ACCEPTED" },
      }),
      prisma.analyticsEvent.count({ where: { ...whereNow, kind: "voice_hosted" } }),
      prisma.analyticsEvent.count({ where: { ...whereNow, kind: "voice_joined" } }),
    ]);

  const delta =
    prevViews > 0 ? Math.round(((views - prevViews) / prevViews) * 100) : null;

  const cards = [
    { label: t("profileViews"), value: views, extra: delta != null ? `${delta > 0 ? "+" : ""}${delta}%` : null },
    { label: t("followers"), value: followers },
    { label: t("contributions"), value: memberships },
    { label: t("applications"), value: applications },
    { label: t("proposals"), value: proposals },
    { label: t("mentorship"), value: sessions },
    { label: t("voiceHosted"), value: voiceHosted },
    { label: t("voiceJoined"), value: voiceJoined },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <h1 className="text-2xl font-semibold">{t("analytics")}</h1>
      <p className="mt-1 text-sm text-secondary">{t("analyticsIntro")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {["7", "30", "90", "365", "all"].map((r) => (
          <Link
            key={r}
            href={`/app/analytics?range=${r}` as never}
            className={`rounded-full border px-3 py-1 text-xs ${range === r ? "border-accent bg-accent-muted" : "border-border"}`}
          >
            {t(`range.${r}`)}
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <article key={c.label} className="rounded-xl border border-border p-4">
            <p className="text-xs text-muted">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold dir-ltr">{c.value}</p>
            {c.extra ? <p className="mt-1 text-xs text-accent dir-ltr">{c.extra}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
