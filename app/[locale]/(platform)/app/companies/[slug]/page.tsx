import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function CompanyPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");
  const company = await prisma.company.findUnique({
    where: { slug },
    include: { jobs: { where: { status: "PUBLISHED" }, take: 10 }, members: { include: { profile: true }, take: 12 } },
  });
  if (!company) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold">{company.name}</h1>
      {company.verificationStatus === "VERIFIED" ? <p className="text-xs text-accent">{t("verified")}</p> : null}
      <p className="mt-3 text-sm leading-7 text-secondary">{company.description}</p>
      <section className="mt-6">
        <h2 className="text-sm font-semibold">{t("jobs")}</h2>
        <ul className="mt-2 space-y-2">
          {company.jobs.map((j) => (
            <li key={j.id}><Link href={`/app/jobs/${j.slug}` as never} className="text-sm text-accent">{j.title}</Link></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
