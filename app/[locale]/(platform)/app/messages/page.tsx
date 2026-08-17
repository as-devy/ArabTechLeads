import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { getCurrentProfile } from "@/lib/auth/session";
import { sendMessageAction } from "@/lib/actions/social";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ c?: string }>;
};

export default async function MessagesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { c } = await searchParams;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.messages");

  const conversations = await prisma.conversation.findMany({
    where: { members: { some: { profileId: me.id } } },
    orderBy: { updatedAt: "desc" },
    include: {
      members: { include: { profile: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const active = c
    ? await prisma.conversation.findFirst({
        where: {
          id: c,
          members: { some: { profileId: me.id } },
        },
        include: {
          members: { include: { profile: true } },
          messages: {
            orderBy: { createdAt: "asc" },
            take: 80,
            include: { sender: true },
          },
        },
      })
    : null;

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-3.5rem)] max-w-6xl lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border-e border-border p-3">
        <h1 className="mb-3 px-2 text-lg font-semibold">{t("title")}</h1>
        {conversations.length === 0 ? (
          <p className="px-2 text-sm text-secondary">{t("empty")}</p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conv) => {
              const other = conv.members.find((m) => m.profileId !== me.id)?.profile;
              const last = conv.messages[0];
              return (
                <li key={conv.id}>
                  <Link
                    href={`/app/messages?c=${conv.id}` as never}
                    className={`flex items-center gap-2 rounded-lg p-2 ${c === conv.id ? "bg-accent-muted" : "hover:bg-surface-elevated"}`}
                  >
                    <Avatar name={other?.fullName} src={other?.avatarUrl} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{other?.fullName}</span>
                      <span className="block truncate text-xs text-muted">
                        {last?.content}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
      <section className="flex flex-col">
        {active ? (
          <>
            <header className="border-b border-border px-4 py-3 text-sm font-medium">
              {active.members.find((m) => m.profileId !== me.id)?.profile.fullName}
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {active.messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.senderId === me.id ? "ms-auto bg-accent text-white" : "bg-surface-elevated"}`}
                >
                  <p>{m.content}</p>
                  <p className={`mt-1 text-[10px] ${m.senderId === me.id ? "text-white/70" : "text-muted"}`}>
                    {formatRelativeTime(m.createdAt, locale)}
                  </p>
                </div>
              ))}
            </div>
            <form
              action={sendMessageAction.bind(null, active.id)}
              className="flex gap-2 border-t border-border p-3"
            >
              <input
                name="content"
                placeholder={t("placeholder")}
                className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm"
              />
              <button className="h-10 rounded-md bg-accent px-4 text-sm text-white">
                →
              </button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-sm text-secondary">
            {t("empty")}
          </div>
        )}
      </section>
    </div>
  );
}
