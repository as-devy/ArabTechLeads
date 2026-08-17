import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/session";
import { applyToJobAction } from "@/lib/actions/opportunities";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function JobDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");
  const job = await prisma.job.findUnique({
    where: { slug },
    include: { company: true, skills: { include: { skill: true } }, applications: { where: { profileId: me.id } } },
  });
  if (!job) notFound();
  const applied = job.applications.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <Link href="/app/jobs" className="text-sm text-muted">← {t("jobs")}</Link>
      <h1 className="mt-3 text-3xl font-semibold">{job.title}</h1>
      <p className="mt-1 text-secondary">{job.company.name} · {job.workMode} · {job.employmentType}</p>
      <p className="mt-1 text-sm text-muted">{job.location}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {job.skills.map((s) => <span key={s.skillId} className="rounded bg-accent-muted px-2 py-0.5 text-xs dir-ltr">{s.skill.name}</span>)}
      </div>
      <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-secondary">{job.description}</p>
      {applied ? <p className="mt-6 text-sm text-accent">{t("applied")}</p> : (
        <form action={applyToJobAction.bind(null, job.id)} className="mt-6 space-y-2 rounded-xl border border-border p-4">
          <textarea name="coverMessage" rows={4} placeholder={t("cover")} className="w-full rounded-md border border-border bg-background p-3 text-sm" />
          <input name="resumeUrl" defaultValue={me.resumeUrl ?? ""} placeholder={t("resume")} className="h-10 w-full rounded-md border border-border px-3 text-sm dir-ltr" />
          <Button type="submit">{t("apply")}</Button>
        </form>
      )}
    </div>
  );
}
