import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { matchJobsForProfile } from "@/lib/recommendations/jobs";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function OpportunitiesHubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");

  const [jobs, freelance, mentors, events, hackathons, matches] = await Promise.all([
    prisma.job.findMany({
      where: { status: "PUBLISHED" },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { company: true },
    }),
    prisma.freelanceOpportunity.findMany({
      where: { status: "OPEN" },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
    prisma.mentorProfile.findMany({
      where: { isActive: true },
      take: 4,
      include: { profile: true },
    }),
    prisma.event.findMany({ orderBy: { startAt: "asc" }, take: 4 }),
    prisma.hackathon.findMany({ orderBy: { startAt: "asc" }, take: 4 }),
    matchJobsForProfile(me.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-6 lg:px-6">
      <header>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-secondary">{t("subtitle")}</p>
      </header>
      <section>
        <h2 className="mb-3 text-sm font-semibold">{t("forYou")}</h2>
        {matches.length === 0 ? (
          <p className="text-sm text-secondary">{t("emptyJobs")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {matches.map((m) => (
              <li key={m.job.id} className="rounded-xl border border-border p-4">
                <Link href={`/app/jobs/${m.job.slug}` as never} className="font-medium">
                  {m.job.title}
                </Link>
                <p className="text-xs text-muted">{m.job.company.name}</p>
                <p className="mt-2 text-xs text-accent">{t("match", { score: m.score })}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <HubBlock title={t("jobs")} href="/app/jobs" empty={t("emptyJobs")} items={jobs.map((j) => ({ href: `/app/jobs/${j.slug}`, title: j.title, meta: j.company.name }))} />
      <HubBlock title={t("freelance")} href="/app/freelance" empty={t("emptyFreelance")} items={freelance.map((f) => ({ href: `/app/freelance/${f.slug}`, title: f.title, meta: f.duration ?? "" }))} />
      <HubBlock title={t("mentors")} href="/app/mentorship" empty={t("emptyMentors")} items={mentors.map((m) => ({ href: `/app/mentorship/${m.profile.username}`, title: m.profile.fullName ?? "", meta: m.topics.join(" · ") }))} />
      <HubBlock title={t("events")} href="/app/events" empty={t("emptyEvents")} items={events.map((e) => ({ href: `/app/events/${e.slug}`, title: e.title, meta: e.startAt.toISOString().slice(0, 10) }))} />
      <HubBlock title={t("hackathons")} href="/app/hackathons" empty={t("emptyHackathons")} items={hackathons.map((h) => ({ href: `/app/hackathons/${h.slug}`, title: h.title, meta: h.prizeDescription ?? "" }))} />
    </div>
  );
}

function HubBlock({
  title,
  href,
  empty,
  items,
}: {
  title: string;
  href: string;
  empty: string;
  items: { href: string; title: string; meta: string }[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link href={href as never} className="text-xs text-accent">
          →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-secondary">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.href} className="rounded-lg border border-border px-3 py-2">
              <Link href={item.href as never} className="text-sm font-medium">
                {item.title}
              </Link>
              <p className="text-xs text-muted">{item.meta}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
