import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { CommunityBanner, CommunityAvatar } from "@/components/communities/community-identity";
import { getCurrentProfile } from "@/lib/auth/session";
import { toggleCommunityMembershipAction } from "@/lib/actions/social";
import { respondCommunityInviteAction } from "@/lib/actions/communities";
import { prisma, prismaModel } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function CommunitiesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.communities");
  const loc = await getLocale();

  const invitation = prismaModel<{
    findMany: (args: unknown) => Promise<
      Array<{
        id: string;
        inviter: { fullName: string | null };
        community: { nameAr: string; nameEn: string };
      }>
    >;
  }>("communityInvitation");

  const [communities, invites] = await Promise.all([
    prisma.community.findMany({
      include: { _count: { select: { members: true } }, members: { where: { profileId: me.id } } },
      orderBy: [{ isFeatured: "desc" }, { nameEn: "asc" }],
    }),
    invitation?.findMany
      ? invitation.findMany({
          where: { inviteeId: me.id, status: "PENDING" },
          include: { community: true, inviter: true },
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-secondary">{t("createIntro")}</p>
        </div>
        <Link href="/app/communities/create">
          <Button>{t("create")}</Button>
        </Link>
      </div>
      {invites.length > 0 ? (
        <section className="mt-6 space-y-2">
          <h2 className="text-sm font-semibold">{t("invites")}</h2>
          {invites.map((invite) => (
            <article key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
              <p className="text-sm">
                {invite.inviter.fullName} · {loc === "ar" ? invite.community.nameAr : invite.community.nameEn}
              </p>
              <div className="flex gap-2">
                <form action={respondCommunityInviteAction.bind(null, invite.id, "ACCEPTED")}>
                  <Button size="sm">{t("accept")}</Button>
                </form>
                <form action={respondCommunityInviteAction.bind(null, invite.id, "REJECTED")}>
                  <Button size="sm" variant="secondary">
                    {t("decline")}
                  </Button>
                </form>
              </div>
            </article>
          ))}
        </section>
      ) : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {communities.length === 0 ? (
          <p className="text-sm text-secondary">{t("empty")}</p>
        ) : (
          communities.map((c) => {
            const membership = c.members[0];
            const joined = Boolean(membership);
            const name = loc === "ar" ? c.nameAr : c.nameEn;
            const themeColor = "themeColor" in c ? (c.themeColor as string) : "#0284c7";
            const imageUrl = "imageUrl" in c ? (c.imageUrl as string | null) : null;
            const isOpen = !("isOpen" in c) || c.isOpen !== false;
            return (
              <article key={c.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                <CommunityBanner
                  community={{ slug: c.slug, name, themeColor, imageUrl }}
                  compact
                />
                <div className="px-4 pb-4">
                  <div className="-mt-8 flex items-end justify-between gap-3">
                    <CommunityAvatar
                      community={{ slug: c.slug, name, themeColor, imageUrl }}
                      size="lg"
                    />
                    {!isOpen ? (
                      <span className="mb-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted">
                        {t("inviteOnly")}
                      </span>
                    ) : null}
                  </div>
                  <Link href={`/app/communities/${c.slug}` as never} className="mt-3 block text-lg font-medium">
                    {name}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-secondary">{c.description}</p>
                  <p className="mt-2 text-xs text-muted">{t("members", { count: c._count.members })}</p>
                  {isOpen || joined ? (
                    membership?.role === "owner" ? null : (
                    <form action={toggleCommunityMembershipAction.bind(null, c.id)} className="mt-3">
                      <button className="h-8 rounded-md border border-border px-3 text-xs">
                        {joined ? t("leave") : t("join")}
                      </button>
                    </form>
                    )
                  ) : (
                    <p className="mt-3 text-xs text-muted">{t("inviteOnlyHint")}</p>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
