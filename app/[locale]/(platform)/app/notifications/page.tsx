import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  markNotificationReadAction,
  markNotificationsReadAction,
} from "@/lib/actions/social";
import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/format";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function NotificationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.notifications");

  const items = await prisma.notification.findMany({
    where: { recipientId: me.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: true },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <form action={markNotificationsReadAction}>
          <button className="text-xs text-accent">{t("markAll")}</button>
        </form>
      </div>
      <ul className="mt-6 space-y-2">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-secondary">{t("empty")}</p>
        ) : (
          items.map((n) => (
            <li
              key={n.id}
              className={`flex gap-3 rounded-xl border p-3 ${n.isRead ? "border-border" : "border-accent/40 bg-accent-muted/40"}`}
            >
              <Avatar name={n.actor?.fullName} src={n.actor?.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  {n.actor?.fullName ? `${n.actor.fullName} · ` : ""}
                  {n.type.startsWith("VOICE_") ? t(`types.${n.type}`) : n.type.toLowerCase()}
                </p>
                <p className="text-xs text-muted">
                  {formatRelativeTime(n.createdAt, locale)}
                </p>
                {n.message?.includes(":") ? (
                  <Link
                    href={`/app/voice/${n.message.split(":")[0]}` as never}
                    className="mt-1 inline-block text-xs text-accent"
                  >
                    {n.message.split(":").slice(1).join(":") || n.message}
                  </Link>
                ) : null}
              </div>
              {!n.isRead ? (
                <form action={markNotificationReadAction.bind(null, n.id)}>
                  <button className="text-[11px] text-accent">✓</button>
                </form>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
