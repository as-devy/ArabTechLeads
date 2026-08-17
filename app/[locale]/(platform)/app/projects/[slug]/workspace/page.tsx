import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getMembership } from "@/lib/projects/access";
import {
  commentDiscussionAction,
  createDiscussionAction,
  createTaskAction,
  updateTaskStatusAction,
} from "@/lib/actions/projects";
import {
  commentIssueAction,
  createIssueAction,
  createMilestoneAction,
  saveProjectDocAction,
} from "@/lib/actions/stage5";
import { TASK_STATUSES } from "@/lib/projects/constants";
import { Button } from "@/components/ui/button";
import { VoiceRoomsSection } from "@/components/voice/voice-rooms-section";
import { listVoiceRooms } from "@/lib/voice/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function ProjectWorkspacePage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const { tab = "tasks" } = await searchParams;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.projects");

  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      members: { include: { profile: true } },
      tasks: {
        orderBy: { createdAt: "desc" },
        take: 40,
        include: { assignee: true },
      },
      discussions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          author: true,
          comments: { take: 8, include: { author: true }, orderBy: { createdAt: "asc" } },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { actor: true },
      },
      milestones: { orderBy: { createdAt: "asc" }, take: 20 },
      issues: { orderBy: { createdAt: "desc" }, take: 20, include: { comments: true } },
      docs: true,
    },
  });
  if (!project) notFound();
  const membership = await getMembership(project.id, me.id);
  if (!membership) redirect(`/app/projects/${slug}`);

  const tabs = [
    { id: "tasks", label: t("tasks") },
    { id: "issues", label: t("issues") },
    { id: "roadmap", label: t("roadmap") },
    { id: "docs", label: t("docs") },
    { id: "discussions", label: t("discussions") },
    { id: "team", label: t("team") },
    { id: "activity", label: t("activity") },
    { id: "voice", label: t("voice") },
  ];

  const grouped = {
    TODO: project.tasks.filter((x) => x.status === "TODO"),
    IN_PROGRESS: project.tasks.filter((x) => x.status === "IN_PROGRESS"),
    REVIEW: project.tasks.filter((x) => x.status === "REVIEW"),
    DONE: project.tasks.filter((x) => x.status === "DONE"),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <Link href={`/app/projects/${slug}` as never} className="text-sm text-muted">
        ← {project.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{t("workspace")}</h1>
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`/app/projects/${slug}/workspace?tab=${item.id}` as never}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${tab === item.id ? "border-accent bg-accent-muted" : "border-border"}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {tab === "tasks" ? (
        <div className="mt-6 space-y-6">
          <form action={createTaskAction.bind(null, project.id)} className="flex flex-wrap gap-2">
            <input name="title" required placeholder={t("taskTitle")} className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm" />
            <select name="assigneeId" className="h-10 rounded-md border border-border bg-background px-2 text-sm">
              <option value="">—</option>
              {project.members.map((m) => (
                <option key={m.profileId} value={m.profileId}>
                  {m.profile.fullName}
                </option>
              ))}
            </select>
            <Button type="submit">{t("createTask")}</Button>
          </form>
          {project.tasks.length === 0 ? (
            <p className="text-sm text-secondary">{t("noTasks")}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {TASK_STATUSES.map((status) => (
                <section key={status} className="rounded-xl border border-border p-3">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    {status === "TODO"
                      ? t("todo")
                      : status === "IN_PROGRESS"
                        ? t("inProgress")
                        : status === "REVIEW"
                          ? t("review")
                          : t("done")}
                  </h2>
                  <ul className="space-y-2">
                    {grouped[status].map((task) => (
                      <li key={task.id} className="rounded-lg border border-border bg-surface p-2">
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-[11px] text-muted">{task.assignee?.fullName}</p>
                        <form action={updateTaskStatusAction.bind(null, task.id, nextStatus(status))} className="mt-2">
                          <button className="text-[11px] text-accent" type="submit">
                            →
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === "discussions" ? (
        <div className="mt-6 space-y-4">
          <form action={createDiscussionAction.bind(null, project.id)} className="space-y-2 rounded-xl border border-border p-4">
            <input name="title" required placeholder={t("discussionTitle")} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
            <textarea name="content" required rows={3} className="w-full rounded-md border border-border bg-background p-3 text-sm" />
            <Button type="submit">{t("createDiscussion")}</Button>
          </form>
          {project.discussions.length === 0 ? (
            <p className="text-sm text-secondary">{t("noDiscussions")}</p>
          ) : (
            project.discussions.map((d) => (
              <article key={d.id} className="rounded-xl border border-border p-4">
                <h3 className="font-medium">{d.title}</h3>
                <p className="mt-1 text-sm text-secondary">{d.content}</p>
                <p className="mt-1 text-xs text-muted">{d.author.fullName}</p>
                <ul className="mt-3 space-y-2">
                  {d.comments.map((c) => (
                    <li key={c.id} className="text-sm">
                      <span className="font-medium">{c.author.fullName}: </span>
                      {c.content}
                    </li>
                  ))}
                </ul>
                <form action={commentDiscussionAction.bind(null, d.id)} className="mt-3 flex gap-2">
                  <input name="content" className="h-9 min-w-0 flex-1 rounded-md border border-border px-3 text-sm" />
                  <Button type="submit" size="sm">{t("submit")}</Button>
                </form>
              </article>
            ))
          )}
        </div>
      ) : null}

      {tab === "team" ? (
        <ul className="mt-6 space-y-2">
          {project.members.map((m) => (
            <li key={m.id} className="rounded-lg border border-border p-3 text-sm">
              {m.profile.fullName} · {m.roleName}
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "activity" ? (
        <ul className="mt-6 space-y-2">
          {project.activities.map((a) => (
            <li key={a.id} className="text-sm text-secondary">
              {a.actor?.fullName} {a.message}
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "roadmap" ? (
        <div className="mt-6 space-y-3">
          <form action={createMilestoneAction.bind(null, project.id)} className="flex flex-wrap gap-2">
            <input name="title" required placeholder={t("milestone")} className="h-10 min-w-0 flex-1 rounded-md border border-border px-3 text-sm" />
            <Button type="submit">{t("create")}</Button>
          </form>
          {project.milestones.map((m) => (
            <article key={m.id} className="rounded-xl border border-border p-3">
              <p className="font-medium">{m.title}</p>
              <p className="text-xs text-muted">{m.status}</p>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "issues" ? (
        <div className="mt-6 space-y-3">
          <form action={createIssueAction.bind(null, project.id)} className="space-y-2 rounded-xl border border-border p-4">
            <input name="title" required placeholder={t("issueTitle")} className="h-10 w-full rounded-md border border-border px-3 text-sm" />
            <textarea name="description" required rows={3} className="w-full rounded-md border border-border p-3 text-sm" />
            <Button type="submit">{t("createIssue")}</Button>
          </form>
          {project.issues.map((issue) => (
            <article key={issue.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">{issue.title}</p>
              <p className="mt-1 text-sm text-secondary">{issue.description}</p>
              <p className="text-xs text-muted">{issue.status} · {issue.priority}</p>
              <form action={commentIssueAction.bind(null, issue.id)} className="mt-3 flex gap-2">
                <input name="body" className="h-9 min-w-0 flex-1 rounded-md border border-border px-3 text-sm" />
                <Button type="submit" size="sm">{t("submit")}</Button>
              </form>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "docs" ? (
        <form action={saveProjectDocAction.bind(null, project.id)} className="mt-6 space-y-2 rounded-xl border border-border p-4">
          <select name="section" className="h-10 rounded-md border border-border px-2 text-sm">
            <option value="overview">overview</option>
            <option value="getting-started">getting-started</option>
            <option value="architecture">architecture</option>
            <option value="contributing">contributing</option>
            <option value="setup">setup</option>
          </select>
          <textarea name="body" required rows={8} className="w-full rounded-md border border-border p-3 text-sm" />
          <Button type="submit">{t("saveDoc")}</Button>
          <ul className="space-y-2 text-sm">
            {project.docs.map((d) => (
              <li key={d.id} className="rounded-lg border border-border p-3">
                <p className="dir-ltr text-xs text-muted">{d.section}</p>
                <p className="mt-1 whitespace-pre-wrap">{d.body}</p>
              </li>
            ))}
          </ul>
        </form>
      ) : null}
      {tab === "voice" ? (
        <VoiceRoomsSection
          rooms={await listVoiceRooms(me.id, { projectId: project.id })}
          createHref={`/app/voice/create?project=${project.id}&type=PROJECT`}
        />
      ) : null}
    </div>
  );
}

function nextStatus(status: (typeof TASK_STATUSES)[number]) {
  const i = TASK_STATUSES.indexOf(status);
  return TASK_STATUSES[Math.min(i + 1, TASK_STATUSES.length - 1)];
}
