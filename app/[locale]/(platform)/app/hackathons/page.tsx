import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string }> };

export default async function HackathonsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");
  const items = await prisma.hackathon.findMany({ orderBy: { startAt: "asc" }, take: 20 });
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-semibold">{t("hackathons")}</h1>
      <ul className="mt-6 space-y-3">
        {items.length === 0 ? <p className="text-sm text-secondary">{t("emptyHackathons")}</p> : items.map((h) => (
          <li key={h.id} className="rounded-xl border border-border p-4">
            <Link href={`/app/hackathons/${h.slug}` as never} className="font-medium">{h.title}</Link>
            <p className="text-xs text-muted">{h.startAt.toISOString().slice(0, 10)} → {h.endAt.toISOString().slice(0, 10)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
