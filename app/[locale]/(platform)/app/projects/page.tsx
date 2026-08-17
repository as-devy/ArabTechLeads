import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { ProjectCard } from "@/components/projects/project-card";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string; status?: string }>;
};

export default async function ProjectsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q, type, status } = await searchParams;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.projects");

  const where = {
    visibility: "PUBLIC" as const,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { shortDescription: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(type ? { projectType: type as never } : {}),
    ...(status ? { status: status as never } : {}),
  };

  const include = {
    owner: true,
    technologies: { include: { skill: true } },
    roles: true,
    _count: { select: { members: true } },
  };

  const [recent, looking] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 12,
      include,
    }),
    prisma.project.findMany({
      where: { ...where, collaborationStatus: "LOOKING" },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 max-w-xl text-sm text-secondary">{t("subtitle")}</p>
        </div>
        <Link href="/app/projects/create">
          <Button>{t("create")}</Button>
        </Link>
      </div>
      <form className="mt-6">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("search")}
          className="h-10 w-full max-w-md rounded-md border border-border bg-background px-3 text-sm"
        />
      </form>
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">{t("hiring")}</h2>
        {looking.length === 0 ? (
          <p className="text-sm text-secondary">{t("empty")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {looking.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold">{t("recent")}</h2>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
            <p>{t("empty")}</p>
            <Link href="/app/projects/create" className="mt-3 inline-block text-sm text-accent">
              {t("emptyCta")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recent.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
