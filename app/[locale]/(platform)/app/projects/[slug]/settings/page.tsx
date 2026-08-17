import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { deleteProjectAction, updateProjectSettingsAction } from "@/lib/actions/projects";
import { COLLAB_STATUSES, PROJECT_STATUSES } from "@/lib/projects/constants";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function ProjectSettingsPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.projects");

  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) notFound();
  if (project.ownerId !== me.id) redirect(`/app/projects/${slug}`);

  return (
    <div className="mx-auto max-w-xl px-4 py-8 lg:px-6">
      <h1 className="text-2xl font-semibold">{t("settings")}</h1>
      <form action={updateProjectSettingsAction.bind(null, project.id)} className="mt-6 space-y-3">
        <input name="name" defaultValue={project.name} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
        <input name="shortDescription" defaultValue={project.shortDescription} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
        <textarea name="description" defaultValue={project.description} rows={5} className="w-full rounded-md border border-border bg-background p-3 text-sm" />
        <select name="status" defaultValue={project.status} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
        <select name="collaborationStatus" defaultValue={project.collaborationStatus} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
          {COLLAB_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input name="githubUrl" defaultValue={project.githubUrl ?? ""} dir="ltr" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
        <Button type="submit">{t("save")}</Button>
      </form>
      <form action={deleteProjectAction.bind(null, project.id)} className="mt-10">
        <p className="mb-2 text-sm text-secondary">{t("deleteConfirm")}</p>
        <Button type="submit" variant="secondary">{t("delete")}</Button>
      </form>
    </div>
  );
}
