import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AssessmentForm } from "@/components/stage5/assessment-form";
import { getCurrentProfile } from "@/lib/auth/session";
import { ASSESSMENT_SKILLS } from "@/lib/assessments/bank";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function AssessmentPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  if (!ASSESSMENT_SKILLS.includes(slug)) notFound();
  const t = await getTranslations("app.stage5");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <h1 className="text-2xl font-semibold">{t("assessment")} · <span className="dir-ltr">{slug}</span></h1>
      <p className="mt-2 text-sm text-secondary">{t("assessmentDisclaimer")}</p>
      <div className="mt-6">
        <AssessmentForm skillSlug={slug} />
      </div>
    </div>
  );
}
