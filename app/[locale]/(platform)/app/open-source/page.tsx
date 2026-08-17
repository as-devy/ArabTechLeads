import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { ProjectCard } from "@/components/projects/project-card";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createProjectFromTemplateAction } from "@/lib/actions/stage5";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tech?: string }>;
};

export default async function OpenSourcePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { tech } = await searchParams;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.stage5");

  const projects = await prisma.project.findMany({
    where: {
      projectType: "OPEN_SOURCE",
      visibility: "PUBLIC",
      ...(tech
        ? { technologies: { some: { skill: { name: { contains: tech, mode: "insensitive" } } } } }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 24,
    include: {
      owner: true,
      technologies: { include: { skill: true } },
      roles: true,
      _count: { select: { members: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("openSource")}</h1>
          <p className="mt-1 text-sm text-secondary">{t("ossIntro")}</p>
        </div>
        <form action={createProjectFromTemplateAction.bind(null, "oss")}>
          <Button type="submit">{t("startOss")}</Button>
        </form>
      </div>
      <form className="mt-6">
        <input
          name="tech"
          defaultValue={tech}
          placeholder={t("filterTech")}
          className="h-10 w-full max-w-md rounded-md border border-border px-3 text-sm dir-ltr"
        />
      </form>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {projects.length === 0 ? (
          <p className="text-sm text-secondary">{t("emptyOss")}</p>
        ) : (
          projects.map((p) => <ProjectCard key={p.id} project={p} />)
        )}
      </div>
    </div>
  );
}
