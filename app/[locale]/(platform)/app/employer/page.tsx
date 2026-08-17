import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { updateApplicationStatusAction } from "@/lib/actions/opportunities";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string }> };

export default async function EmployerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");
  const jobs = await prisma.job.findMany({
    where: { createdById: me.id },
    include: { applications: { include: { profile: true } }, company: true },
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-semibold">{t("employer")}</h1>
      {jobs.length === 0 ? <p className="mt-6 text-sm text-secondary">{t("emptyJobs")}</p> : jobs.map((job) => (
        <section key={job.id} className="mt-6 rounded-xl border border-border p-4">
          <Link href={`/app/jobs/${job.slug}` as never} className="font-medium">{job.title}</Link>
          <ul className="mt-3 space-y-2">
            {job.applications.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{a.profile.fullName} · {a.status}</span>
                <form action={updateApplicationStatusAction.bind(null, a.id, "SHORTLISTED")}>
                  <button className="text-xs text-accent" type="submit">Shortlist</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
