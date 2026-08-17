import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export default async function JobsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q } = await searchParams;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");

  const jobs = await prisma.job.findMany({
    where: {
      status: "PUBLISHED",
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { company: true, skills: { include: { skill: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("jobs")}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/app/jobs/applications"><Button variant="secondary" size="sm">{t("applications")}</Button></Link>
          <Link href="/app/jobs/create"><Button size="sm">{t("createJob")}</Button></Link>
        </div>
      </div>
      <form className="mt-4">
        <input name="q" defaultValue={q} placeholder={t("searchJob")} className="h-10 w-full max-w-md rounded-md border border-border bg-background px-3 text-sm" />
      </form>
      <ul className="mt-6 space-y-3">
        {jobs.length === 0 ? <p className="text-sm text-secondary">{t("emptyJobs")}</p> : jobs.map((job) => (
          <li key={job.id} className="rounded-xl border border-border p-4">
            <Link href={`/app/jobs/${job.slug}` as never} className="text-lg font-medium">{job.title}</Link>
            <p className="text-sm text-secondary">{job.company.name} · {job.workMode} · {job.location}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {job.skills.map((s) => <span key={s.skillId} className="rounded bg-accent-muted px-1.5 py-0.5 text-[11px] dir-ltr">{s.skill.name}</span>)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
