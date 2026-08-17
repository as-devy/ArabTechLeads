import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string }> };

export default async function EventsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");
  const events = await prisma.event.findMany({ orderBy: { startAt: "asc" }, take: 30, include: { organizer: true } });
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">{t("events")}</h1>
        <Link href="/app/events/create"><Button size="sm">{t("createEvent")}</Button></Link>
      </div>
      <ul className="mt-6 space-y-3">
        {events.length === 0 ? <p className="text-sm text-secondary">{t("emptyEvents")}</p> : events.map((e) => (
          <li key={e.id} className="rounded-xl border border-border p-4">
            <Link href={`/app/events/${e.slug}` as never} className="font-medium">{e.title}</Link>
            <p className="text-xs text-muted">{e.startAt.toISOString().slice(0, 16).replace("T", " ")} · {e.isOnline ? "Online" : e.location}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
