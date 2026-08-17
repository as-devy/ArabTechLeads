import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export type ProjectCardData = {
  slug: string;
  name: string;
  shortDescription: string;
  status: string;
  collaborationStatus: string;
  owner: { fullName: string | null; username: string | null };
  technologies: { skill: { name: string } }[];
  roles: { name: string }[];
  _count: { members: number };
};

export async function ProjectCard({ project }: { project: ProjectCardData }) {
  const t = await getTranslations("app.projects");
  const collab =
    project.collaborationStatus === "LOOKING"
      ? t("looking")
      : project.collaborationStatus === "COMPLETE"
        ? t("complete")
        : t("notLooking");

  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-10 place-items-center rounded-lg border border-border bg-background font-mono text-xs font-semibold text-accent">
          {project.name.slice(0, 2).toUpperCase()}
        </div>
        <span className="rounded-md bg-accent-muted px-2 py-0.5 text-[11px] text-secondary">
          {t(`status.${project.status}` as never)}
        </span>
      </div>
      <h3 className="mt-3 text-base font-semibold">{project.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm leading-6 text-secondary">
        {project.shortDescription}
      </p>
      <p className="mt-2 text-xs text-muted">
        {project.owner.fullName}
        {project.owner.username ? (
          <span className="dir-ltr"> @{project.owner.username}</span>
        ) : null}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.technologies.slice(0, 4).map((item) => (
          <span
            key={item.skill.name}
            className="rounded-md border border-border px-1.5 py-0.5 text-[11px] dir-ltr"
          >
            {item.skill.name}
          </span>
        ))}
      </div>
      {project.collaborationStatus === "LOOKING" && project.roles.length > 0 ? (
        <p className="mt-3 text-xs text-secondary">
          {t("looking")}: {project.roles.map((r) => r.name).join(" · ")}
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted">{collab}</p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted">{t("members", { count: project._count.members })}</span>
        <Link
          href={`/app/projects/${project.slug}` as never}
          className="text-xs font-medium text-accent hover:underline"
        >
          {t("view")}
        </Link>
      </div>
    </article>
  );
}
