import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { submitFreelanceProposalAction } from "@/lib/actions/opportunities";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function FreelanceDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");
  const gig = await prisma.freelanceOpportunity.findUnique({
    where: { slug },
    include: { creator: true, skills: { include: { skill: true } }, proposals: { where: { profileId: me.id } } },
  });
  if (!gig) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/app/freelance" className="text-sm text-muted">← {t("freelance")}</Link>
      <h1 className="mt-3 text-2xl font-semibold">{gig.title}</h1>
      <p className="mt-2 text-sm text-secondary">{gig.budgetMin}–{gig.budgetMax} {gig.currency} · {gig.duration}</p>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{gig.description}</p>
      {gig.proposals.length ? <p className="mt-6 text-sm text-accent">{t("applied")}</p> : (
        <form action={submitFreelanceProposalAction.bind(null, gig.id)} className="mt-6 space-y-2 rounded-xl border border-border p-4">
          <textarea name="message" required rows={4} className="w-full rounded-md border border-border p-3 text-sm" />
          <input name="estimatedPrice" placeholder="Price" className="h-10 rounded-md border border-border px-3 text-sm" />
          <input name="estimatedDuration" placeholder="Duration" className="h-10 rounded-md border border-border px-3 text-sm" />
          <Button type="submit">{t("proposal")}</Button>
        </form>
      )}
    </div>
  );
}
