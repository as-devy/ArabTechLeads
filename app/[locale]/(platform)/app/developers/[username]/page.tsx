import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Avatar } from "@/components/ui/avatar";
import { DeveloperActions } from "@/components/developers/developer-actions";
import { ReputationBars } from "@/components/stage5/reputation-bars";
import { TrustActions } from "@/components/stage5/trust-actions";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getReputationSummary } from "@/lib/reputation/calculator";
import { trackAnalyticsEvent } from "@/lib/actions/stage5";
import { respondRecommendationAction } from "@/lib/actions/stage5";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; username: string }>;
};

export default async function DeveloperProfilePage({ params }: Props) {
  const { locale, username: rawUsername } = await params;
  setRequestLocale(locale);
  const username = decodeURIComponent(rawUsername).replace(/^@/, "").trim();
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.profile");
  const s5 = await getTranslations("app.stage5");

  if (!username) notFound();

  const profile = await prisma.profile.findFirst({
    where: { username },
    include: {
      role: true,
      country: true,
      skills: { include: { skill: true } },
      interests: { include: { interest: true } },
      communityMemberships: { include: { community: true } },
      githubAccount: true,
      certifications: true,
      skillVerifications: { include: { skill: true } },
      achievements: { include: { achievement: true } },
      recsReceived: {
        where: { status: "ACCEPTED" },
        include: { author: true },
        take: 8,
      },
      endorsementsReceived: {
        include: { skill: true, endorser: true },
        take: 40,
      },
      _count: { select: { followers: true, following: true, projectMemberships: true } },
    },
  });
  if (!profile) notFound();

  if (me.id !== profile.id) {
    await trackAnalyticsEvent(profile.id, "profile_view");
  }

  const [memberships, reputation, following, pendingRecs, posts] = await Promise.all([
    prisma.projectMember.findMany({
      where: { profileId: profile.id },
      take: 12,
      include: {
        project: { include: { technologies: { include: { skill: true } } } },
      },
    }),
    getReputationSummary(profile.id),
    prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: me.id, followingId: profile.id },
      },
    }),
    me.id === profile.id
      ? prisma.professionalRecommendation.findMany({
          where: { recipientId: profile.id, status: "PENDING" },
          include: { author: true },
        })
      : Promise.resolve([]),
    prisma.post.findMany({
      where: { authorId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, content: true, createdAt: true, type: true },
    }),
  ]);

  const publicMemberships = memberships.filter(
    (m) => m.project.visibility === "PUBLIC" || m.project.showcase,
  );
  const oss = publicMemberships.filter((m) => m.project.projectType === "OPEN_SOURCE");
  const endorsementCounts = new Map<string, { name: string; n: number }>();
  for (const e of profile.endorsementsReceived) {
    const cur = endorsementCounts.get(e.skillId) ?? { name: e.skill.name, n: 0 };
    cur.n += 1;
    endorsementCounts.set(e.skillId, cur);
  }

  const verifiedIds = new Set(profile.skillVerifications.map((v) => v.skillId));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="h-32 bg-gradient-to-l from-accent/20 to-surface-elevated" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <Avatar name={profile.fullName} src={profile.avatarUrl} size="xl" className="ring-4 ring-background" />
            <DeveloperActions
              profileId={profile.id}
              username={profile.username}
              isFollowing={Boolean(following)}
              isSelf={me.id === profile.id}
            />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">{profile.fullName}</h1>
          {profile.headline ? (
            <p className="mt-1 text-sm text-secondary">{profile.headline}</p>
          ) : null}
          <p className="text-sm text-muted dir-ltr">@{profile.username}</p>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
            {profile.email ? <span className="rounded-md bg-accent-muted px-2 py-0.5">✓ {s5("email")}</span> : null}
            {profile.githubAccount || profile.githubUrl ? (
              <span className="rounded-md bg-accent-muted px-2 py-0.5">✓ {s5("github")}</span>
            ) : null}
            {profile.skillVerifications.map((v) => (
              <span key={v.id} className="rounded-md bg-accent-muted px-2 py-0.5">
                ✓ {v.skill.name}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            {s5("openTo")}:
            {profile.openToWork ? ` ${s5("fullTime")}` : ""}
            {profile.openToFreelance ? ` · ${s5("freelance")}` : ""}
            {profile.openToMentorship ? ` · ${s5("mentorship")}` : ""}
          </p>
          <p className="mt-1 text-sm text-secondary">
            {locale === "ar" ? profile.role?.nameAr : profile.role?.nameEn}
            {profile.country
              ? ` · ${locale === "ar" ? profile.country.nameAr : profile.country.nameEn}`
              : ""}
          </p>
          <p className="mt-3 text-sm text-secondary">
            {profile._count.followers} {t("followers")} · {profile._count.projectMemberships}{" "}
            {t("projects")} · {oss.length} {s5("openSource")}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold">{t("about")}</h2>
            <p className="mt-2 text-sm leading-7 text-secondary">{profile.bio || "—"}</p>
          </section>
          <section>
            <h2 className="text-sm font-semibold">{t("skills")}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <span key={s.skillId} className="rounded-md bg-accent-muted px-2 py-1 text-xs">
                  {s.skill.name}
                  {verifiedIds.has(s.skillId) ? " ✓" : ""}
                  {endorsementCounts.has(s.skillId)
                    ? ` · ${endorsementCounts.get(s.skillId)!.n}`
                    : ""}
                </span>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold">{t("projects")}</h2>
            {publicMemberships.length === 0 ? (
              <p className="mt-3 text-sm text-secondary">{s5("emptyContributions")}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {publicMemberships.map((m) => (
                  <li key={m.id} className="rounded-lg border border-border p-3">
                    <Link href={`/app/projects/${m.project.slug}` as never} className="font-medium">
                      {m.project.name}
                    </Link>
                    <p className="text-xs text-muted">{m.roleName}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="text-sm font-semibold">{s5("contributions")}</h2>
            {posts.length === 0 && publicMemberships.length === 0 ? (
              <p className="mt-3 text-sm text-secondary">{s5("emptyContributions")}</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {publicMemberships.slice(0, 5).map((m) => (
                  <li key={`p-${m.id}`}>● {s5("joinedProject")} {m.project.name}</li>
                ))}
                {posts.slice(0, 5).map((p) => (
                  <li key={p.id}>● {p.type === "CODE" ? s5("sharedCode") : s5("publishedPost")}</li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="text-sm font-semibold">{s5("recommendations")}</h2>
            {profile.recsReceived.length === 0 ? (
              <p className="mt-3 text-sm text-secondary">{s5("emptyRecs")}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {profile.recsReceived.map((r) => (
                  <li key={r.id} className="rounded-lg border border-border p-3 text-sm">
                    <p>{r.body}</p>
                    <p className="mt-2 text-xs text-muted">{r.author.fullName}</p>
                  </li>
                ))}
              </ul>
            )}
            {pendingRecs.map((r) => (
              <div key={r.id} className="mt-3 rounded-lg border border-accent/40 p-3 text-sm">
                <p>{r.body}</p>
                <p className="text-xs text-muted">{r.author.fullName}</p>
                <div className="mt-2 flex gap-2">
                  <form action={respondRecommendationAction.bind(null, r.id, "ACCEPTED")}>
                    <Button size="sm">{s5("accept")}</Button>
                  </form>
                  <form action={respondRecommendationAction.bind(null, r.id, "DECLINED")}>
                    <Button size="sm" variant="secondary">
                      {s5("decline")}
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </section>
          <section>
            <h2 className="text-sm font-semibold">{s5("achievements")}</h2>
            {profile.achievements.length === 0 ? (
              <p className="mt-3 text-sm text-secondary">{s5("emptyAchievements")}</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.achievements.map((a) => (
                  <span key={a.achievementId} className="rounded-md border border-border px-2 py-1 text-xs">
                    {locale === "ar" ? a.achievement.nameAr : a.achievement.nameEn}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className="space-y-4">
          <ReputationBars rows={reputation} />
          {me.id !== profile.id ? (
            <TrustActions
              recipientId={profile.id}
              skills={profile.skills.map((s) => ({ id: s.skillId, name: s.skill.name }))}
            />
          ) : (
            <Link href="/app/verification" className="block rounded-xl border border-border p-4 text-sm">
              {s5("verification")}
            </Link>
          )}
          <section className="rounded-xl border border-border p-4">
            <h2 className="text-sm font-semibold">{t("communities")}</h2>
            <ul className="mt-2 space-y-1 text-xs">
              {profile.communityMemberships.map((m) => (
                <li key={m.communityId}>
                  {locale === "ar" ? m.community.nameAr : m.community.nameEn}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
