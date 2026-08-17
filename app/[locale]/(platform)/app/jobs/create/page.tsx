import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { createJobAction } from "@/lib/actions/opportunities";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function CreateJobPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");
  const companies = await prisma.companyMember.findMany({
    where: { profileId: me.id },
    include: { company: true },
  });

  if (companies.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-sm text-secondary">
        {t("emptyCompanies")} — <Link href="/app/companies/create" className="text-accent">{t("createCompany")}</Link>
      </div>
    );
  }

  return (
    <form action={createJobAction} className="mx-auto max-w-xl space-y-3 px-4 py-8">
      <h1 className="text-2xl font-semibold">{t("createJob")}</h1>
      <select name="companyId" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
        {companies.map((c) => <option key={c.companyId} value={c.companyId}>{c.company.name}</option>)}
      </select>
      <input name="title" required placeholder="Title" className="h-10 w-full rounded-md border border-border px-3 text-sm" />
      <textarea name="description" rows={6} className="w-full rounded-md border border-border p-3 text-sm" />
      <input name="location" placeholder="Location / MENA" className="h-10 w-full rounded-md border border-border px-3 text-sm" />
      <select name="workMode" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
        <option value="REMOTE">Remote</option>
        <option value="HYBRID">Hybrid</option>
        <option value="ONSITE">On-site</option>
      </select>
      <select name="employmentType" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
        <option value="FULL_TIME">Full-time</option>
        <option value="PART_TIME">Part-time</option>
        <option value="CONTRACT">Contract</option>
        <option value="INTERNSHIP">Internship</option>
      </select>
      <Button type="submit">{t("createJob")}</Button>
    </form>
  );
}
