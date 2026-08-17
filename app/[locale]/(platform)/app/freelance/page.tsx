import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string }> };

export default async function FreelancePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");
  const items = await prisma.freelanceOpportunity.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { skills: { include: { skill: true } } },
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("freelance")}</h1>
        <Link href="/app/freelance/create"><Button size="sm">{t("createFreelance")}</Button></Link>
      </div>
      <ul className="mt-6 space-y-3">
        {items.length === 0 ? <p className="text-sm text-secondary">{t("emptyFreelance")}</p> : items.map((item) => (
          <li key={item.id} className="rounded-xl border border-border p-4">
            <Link href={`/app/freelance/${item.slug}` as never} className="font-medium">{item.title}</Link>
            <p className="text-xs text-muted">{item.budgetMin ?? 0}–{item.budgetMax ?? 0} {item.currency} · {item.duration}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
