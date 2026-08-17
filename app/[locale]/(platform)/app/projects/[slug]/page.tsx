import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  inviteToProjectAction,
  requestJoinProjectAction,
  respondJoinRequestAction,
} from "@/lib/actions/projects";
import { canViewProject, getProjectBySlug } from "@/lib/projects/access";
import { matchCollaborators } from "@/lib/recommendations/collaborators";
import { startConversationAction } from "@/lib/actions/social";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function ProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.projects");

  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  if (!(await canViewProject(project, me.id))) notFound();

  const isMember = project.members.some((m) => m.profileId === me.id);
  const isOwner = project.ownerId === me.id;

  const matches = isOwner
    ? await matchCollaborators({
        viewerId: me.id,
        requiredSkills: project.technologies.map((x) => x.skill.name),
        requiredRole: project.roles[0]?.name,
      })
    : [];
  const requests = isOwner
    ? await prisma.projectJoinRequest.findMany({
        where: { projectId: project.id, status: "PENDING" },
        include: { profile: true },
      })
    : [];

  let github: { stargazers_count?: number; forks_count?: number; language?: string; description?: string } | null =
    null;
  if (project.githubOwner && project.githubRepo) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${project.githubOwner}/${project.githubRepo}`,
        { next: { revalidate: 3600 }, headers: { Accept: "application/vnd.github+json" } },
      );
      if (res.ok) github = await res.json();
    } catch {
      github = null;
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <Link href="/app/projects" className="text-sm text-muted hover:text-foreground">
        ← {t("back")}
      </Link>
      <header className="mt-4 rounded-xl border border-border p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted">{t(`types.${project.projectType}`)}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{project.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-secondary">{project.shortDescription}</p>
            <p className="mt-2 text-xs text-muted">
              {t("owner")}: {project.owner.fullName}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.technologies.map((item) => (
                <Link
                  key={item.skillId}
                  href={`/app/explore?technology=${item.skill.slug}` as never}
                  className="rounded-md bg-accent-muted px-2 py-0.5 text-[11px] dir-ltr"
                >
                  {item.skill.name}
                </Link>
              ))}
            </div>
            {project.projectType === "OPEN_SOURCE" && project.roles.length > 0 ? (
              <p className="mt-3 text-xs text-secondary">
                Looking for: {project.roles.map((r) => r.name).join(" · ")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {isMember ? (
              <Link href={`/app/projects/${project.slug}/workspace` as never}>
                <Button>{t("workspace")}</Button>
              </Link>
            ) : (
              <form action={requestJoinProjectAction.bind(null, project.id)} className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-xs">{t("whyJoin")}</p>
                <input name="roleName" placeholder="Role" className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm" />
                <textarea name="message" rows={2} className="w-full rounded-md border border-border bg-background p-2 text-sm" />
                <Button type="submit" size="sm">{t("join")}</Button>
              </form>
            )}
            {isOwner ? (
              <Link href={`/app/projects/${project.slug}/settings` as never} className="text-sm text-accent">
                {t("settings")}
              </Link>
            ) : (
              <form action={startConversationAction.bind(null, project.ownerId)}>
                <Button type="submit" variant="secondary" size="sm">
                  {t("owner")}
                </Button>
              </form>
            )}
          </div>
        </div>
        <p className="mt-4 text-xs text-accent">
          {project.collaborationStatus === "LOOKING" ? `🟢 ${t("looking")}` : t("notLooking")}
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold">{t("about")}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-secondary">{project.description}</p>
          </section>
          <section>
            <h2 className="text-sm font-semibold">{t("team")}</h2>
            {project.members.length === 0 ? (
              <p className="mt-2 text-sm text-secondary">{t("noMembers")}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {project.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Avatar name={m.profile.fullName} src={m.profile.avatarUrl} />
                    <div>
                      <Link href={`/app/developers/${m.profile.username}` as never} className="font-medium">
                        {m.profile.fullName}
                      </Link>
                      <p className="text-xs text-muted">{m.roleName}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {project.roles.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold">{t("openPositions")}</h2>
              <ul className="mt-3 space-y-2">
                {project.roles.map((role) => (
                  <li key={role.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium">{role.name}</p>
                    <p className="text-xs text-muted dir-ltr">{role.requiredSkills.join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {isOwner && requests.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold">{t("join")}</h2>
              <ul className="mt-3 space-y-2">
                {requests.map((req) => (
                  <li key={req.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p>{req.profile.fullName}</p>
                      <p className="text-xs text-muted">{req.roleName}</p>
                    </div>
                    <div className="flex gap-2">
                      <form action={respondJoinRequestAction.bind(null, req.id, "ACCEPTED")}>
                        <button className="text-xs text-accent">OK</button>
                      </form>
                      <form action={respondJoinRequestAction.bind(null, req.id, "REJECTED")}>
                        <button className="text-xs text-error">×</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        <aside className="space-y-4">
          <div className="rounded-xl border border-border p-4 text-sm">
            <p className="font-semibold">{t("stats")}</p>
            <p className="mt-2 text-secondary">{t("members", { count: project._count.members })}</p>
            <p className="text-secondary">{project._count.tasks} {t("tasks")}</p>
            <p className="text-secondary">{project._count.discussions} {t("discussions")}</p>
          </div>
          <div className="rounded-xl border border-border p-4 text-sm">
            <p className="font-semibold">{t("links")}</p>
            {project.githubUrl ? (
              <a href={project.githubUrl} className="mt-2 block text-accent dir-ltr" target="_blank">
                GitHub
              </a>
            ) : (
              <p className="mt-2 text-xs text-muted">{t("noGithub")}</p>
            )}
            {github ? (
              <p className="mt-2 text-xs text-muted dir-ltr">
                ★ {github.stargazers_count ?? 0} · forks {github.forks_count ?? 0}
                {github.language ? ` · ${github.language}` : ""}
              </p>
            ) : null}
            {project.demoUrl ? (
              <a href={project.demoUrl} className="mt-1 block text-accent dir-ltr" target="_blank">
                Demo
              </a>
            ) : null}
          </div>
          {isOwner && matches.length > 0 ? (
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm font-semibold">{t("collaborators")}</p>
              <ul className="mt-2 space-y-2">
                {matches.map((m) => (
                  <li key={m.id} className="text-xs">
                    <Link href={`/app/developers/${m.username}` as never} className="font-medium">
                      {m.fullName}
                    </Link>
                    <span className="ms-1 text-muted dir-ltr">{m.sharedSkills.join(", ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {isOwner ? (
            <form action={inviteToProjectAction.bind(null, project.id)} className="rounded-xl border border-border p-4 space-y-2">
              <p className="text-sm font-semibold">{t("invite")}</p>
              <input name="username" placeholder="@username" className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm dir-ltr" />
              <input name="roleName" placeholder="Role" className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm" />
              <textarea name="message" rows={2} className="w-full rounded-md border border-border bg-background p-2 text-sm" />
              <Button type="submit" size="sm">{t("invite")}</Button>
            </form>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
