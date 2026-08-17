import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function ApplicationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");
  const apps = await prisma.jobApplication.findMany({
    where: { profileId: me.id },
    orderBy: { createdAt: "desc" },
    include: { job: { include: { company: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <h1 className="text-2xl font-semibold">{t("applications")}</h1>
      <ul className="mt-6 space-y-2">
        {apps.length === 0 ? <p className="text-sm text-secondary">{t("emptyJobs")}</p> : apps.map((a) => (
          <li key={a.id} className="rounded-lg border border-border p-3">
            <Link href={`/app/jobs/${a.job.slug}` as never} className="font-medium">{a.job.title}</Link>
            <p className="text-xs text-muted">{a.job.company.name} · {a.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
