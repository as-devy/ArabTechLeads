import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string }> };

export default async function CompaniesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" }, take: 40, include: { _count: { select: { jobs: true, members: true } } } });
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">{t("companies")}</h1>
        <Link href="/app/companies/create"><Button size="sm">{t("createCompany")}</Button></Link>
      </div>
      <ul className="mt-6 space-y-3">
        {companies.length === 0 ? <p className="text-sm text-secondary">{t("emptyCompanies")}</p> : companies.map((c) => (
          <li key={c.id} className="rounded-xl border border-border p-4">
            <Link href={`/app/companies/${c.slug}` as never} className="font-medium">{c.name}</Link>
            {c.verificationStatus === "VERIFIED" ? <span className="ms-2 text-xs text-accent">{t("verified")}</span> : null}
            <p className="text-xs text-muted">{c.industry} · {c.location} · {c._count.jobs} jobs</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
