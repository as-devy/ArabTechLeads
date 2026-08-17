import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ASSESSMENT_SKILLS } from "@/lib/assessments/bank";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string }> };

export default async function VerificationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.stage5");

  const [github, skills, company] = await Promise.all([
    prisma.githubAccount.findUnique({ where: { profileId: me.id } }),
    prisma.skillVerification.findMany({
      where: { profileId: me.id },
      include: { skill: true },
    }),
    prisma.companyMember.findFirst({
      where: { profileId: me.id, company: { verificationStatus: "VERIFIED" } },
    }),
  ]);

  const rows = [
    { key: "email", ok: Boolean(me.email), hint: t("emailHint") },
    { key: "github", ok: Boolean(github || me.githubUrl), hint: t("githubHint") },
    { key: "skills", ok: skills.length > 0, hint: t("skillHint") },
    { key: "company", ok: Boolean(company), hint: t("companyHint") },
    { key: "identity", ok: false, hint: t("identityHint") },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <h1 className="text-2xl font-semibold">{t("verification")}</h1>
      <p className="mt-2 text-sm text-secondary">{t("verificationIntro")}</p>
      <ul className="mt-6 space-y-3">
        {rows.map((row) => (
          <li key={row.key} className="rounded-xl border border-border p-4">
            <p className="font-medium">
              {row.ok ? "✓ " : ""}
              {t(row.key)}
            </p>
            <p className="mt-1 text-xs text-muted">{row.hint}</p>
          </li>
        ))}
      </ul>
      {skills.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s.id} className="rounded-md bg-accent-muted px-2 py-1 text-xs">
              {s.skill.name} · {s.score}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-8">
        <h2 className="text-sm font-semibold">{t("assessments")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {ASSESSMENT_SKILLS.map((slug) => (
            <Link
              key={slug}
              href={`/app/assessments/${slug}` as never}
              className="rounded-md border border-border px-3 py-1.5 text-xs dir-ltr"
            >
              {slug}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
