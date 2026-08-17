import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/session";
import { createHackathonTeamAction, requestHackathonTeamAction } from "@/lib/actions/opportunities";
import { awardFirstPlaceAction, submitHackathonProjectAction } from "@/lib/actions/stage5";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function HackathonDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");
  const hackathon = await prisma.hackathon.findUnique({
    where: { slug },
    include: { teams: { include: { members: { include: { profile: true } } } } },
  });
  if (!hackathon) notFound();

  const [memberships, submissions] = await Promise.all([
    prisma.projectMember.findMany({
      where: { profileId: me.id },
      include: { project: true },
    }),
    prisma.hackathonSubmission.findMany({
      where: { hackathonId: hackathon.id },
      include: { project: true },
      orderBy: { place: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold">{hackathon.title}</h1>
      <p className="mt-3 text-sm leading-7 text-secondary">{hackathon.description}</p>
      <p className="mt-2 text-xs text-muted">{hackathon.prizeDescription}</p>
      <form action={createHackathonTeamAction.bind(null, hackathon.id)} className="mt-6 flex gap-2">
        <input name="name" required placeholder="Team name" className="h-10 flex-1 rounded-md border border-border px-3 text-sm" />
        <Button type="submit">Team</Button>
      </form>
      <ul className="mt-6 space-y-2">
        {hackathon.teams.map((team) => (
          <li key={team.id} className="rounded-lg border border-border p-3">
            <p className="font-medium">{team.name}</p>
            <p className="text-xs text-muted">{team.members.map((m) => m.profile.fullName).join(" · ")}</p>
            <form action={requestHackathonTeamAction.bind(null, team.id)} className="mt-2">
              <Button type="submit" size="sm" variant="secondary">{t("register")}</Button>
            </form>
          </li>
        ))}
      </ul>
      <section className="mt-8 rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold">Submit project</h2>
        <form action={submitHackathonProjectAction.bind(null, hackathon.id)} className="mt-3 space-y-2">
          <select name="projectId" className="h-10 w-full rounded-md border border-border px-2 text-sm">
            {memberships.map((m) => (
              <option key={m.projectId} value={m.projectId}>
                {m.project.name}
              </option>
            ))}
          </select>
          <input name="title" required placeholder="Title" className="h-10 w-full rounded-md border border-border px-3 text-sm" />
          <textarea name="description" required rows={3} className="w-full rounded-md border border-border p-3 text-sm" />
          <input name="demoUrl" placeholder="Demo URL" className="h-10 w-full rounded-md border border-border px-3 text-sm dir-ltr" />
          <input name="repoUrl" placeholder="Repository URL" className="h-10 w-full rounded-md border border-border px-3 text-sm dir-ltr" />
          <Button type="submit">{t("apply")}</Button>
        </form>
      </section>
      <section className="mt-6">
        <h2 className="text-sm font-semibold">Results</h2>
        <ul className="mt-2 space-y-2">
          {submissions.map((s) => (
            <li key={s.id} className="rounded-lg border border-border p-3 text-sm">
              {s.place ? `${s.place}. ` : ""}
              {s.title} · {s.status}
              {hackathon.organizerId === me.id ? (
                <form action={awardFirstPlaceAction.bind(null, s.id)} className="mt-2">
                  <Button size="sm" variant="secondary">1st</Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
