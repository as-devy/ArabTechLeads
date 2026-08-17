import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { DeveloperActions } from "@/components/developers/developer-actions";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  respondConnectionAction,
  removeConnectionAction,
  startConversationAction,
} from "@/lib/actions/social";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function NetworkPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { tab = "connections" } = await searchParams;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.network");

  const [connections, requests, following, followers] = await Promise.all([
    prisma.connection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: me.id }, { receiverId: me.id }],
      },
      include: { requester: { include: { role: true } }, receiver: { include: { role: true } } },
    }),
    prisma.connection.findMany({
      where: { receiverId: me.id, status: "PENDING" },
      include: { requester: { include: { role: true } } },
    }),
    prisma.follow.findMany({
      where: { followerId: me.id },
      include: { following: { include: { role: true } } },
    }),
    prisma.follow.findMany({
      where: { followingId: me.id },
      include: { follower: { include: { role: true } } },
    }),
  ]);

  const tabs = [
    { id: "connections", label: t("connections") },
    { id: "requests", label: t("requests") },
    { id: "following", label: t("following") },
    { id: "followers", label: t("followers") },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`/app/network?tab=${item.id}` as never}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${tab === item.id ? "border-accent bg-accent-muted" : "border-border"}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {tab === "connections" &&
          connections.map((c) => {
            const other = c.requesterId === me.id ? c.receiver : c.requester;
            return (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={other.fullName} src={other.avatarUrl} />
                  <div>
                    <p className="font-medium">{other.fullName}</p>
                    <p className="text-xs text-muted">{locale === "ar" ? other.role?.nameAr : other.role?.nameEn}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/app/developers/${other.username}` as never} className="text-xs text-accent">
                    {t("message") === "رسالة" ? "عرض" : "View"}
                  </Link>
                  <form action={startConversationAction.bind(null, other.id)}>
                    <button className="text-xs text-accent">{t("message")}</button>
                  </form>
                  <form action={removeConnectionAction.bind(null, c.id)}>
                    <button className="text-xs text-error">{t("remove")}</button>
                  </form>
                </div>
              </div>
            );
          })}
        {tab === "requests" &&
          requests.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div className="flex items-center gap-3">
                <Avatar name={c.requester.fullName} src={c.requester.avatarUrl} />
                <p className="font-medium">{c.requester.fullName}</p>
              </div>
              <div className="flex gap-2">
                <form action={respondConnectionAction.bind(null, c.id, "ACCEPTED")}>
                  <button className="text-xs text-accent">{t("accept")}</button>
                </form>
                <form action={respondConnectionAction.bind(null, c.id, "REJECTED")}>
                  <button className="text-xs text-error">{t("reject")}</button>
                </form>
              </div>
            </div>
          ))}
        {tab === "following" &&
          following.map((f) => (
            <div key={f.followingId} className="flex items-center justify-between rounded-xl border border-border p-3">
              <div className="flex items-center gap-3">
                <Avatar name={f.following.fullName} src={f.following.avatarUrl} />
                <p>{f.following.fullName}</p>
              </div>
              <DeveloperActions
                profileId={f.followingId}
                username={f.following.username}
                isFollowing
              />
            </div>
          ))}
        {tab === "followers" &&
          followers.map((f) => (
            <div key={f.followerId} className="flex items-center justify-between rounded-xl border border-border p-3">
              <div className="flex items-center gap-3">
                <Avatar name={f.follower.fullName} src={f.follower.avatarUrl} />
                <p>{f.follower.fullName}</p>
              </div>
              <DeveloperActions profileId={f.followerId} username={f.follower.username} isFollowing={false} />
            </div>
          ))}
        {((tab === "connections" && connections.length === 0) ||
          (tab === "requests" && requests.length === 0) ||
          (tab === "following" && following.length === 0) ||
          (tab === "followers" && followers.length === 0)) && (
          <p className="py-10 text-center text-sm text-secondary">{t("empty")}</p>
        )}
      </div>
    </div>
  );
}
