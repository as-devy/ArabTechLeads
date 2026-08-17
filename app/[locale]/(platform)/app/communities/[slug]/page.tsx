import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/posts/post-card";
import { PostComposer } from "@/components/posts/post-composer";
import { DeveloperActions } from "@/components/developers/developer-actions";
import { CommunityAvatar, CommunityBanner } from "@/components/communities/community-identity";
import { getCurrentProfile } from "@/lib/auth/session";
import { toggleCommunityMembershipAction } from "@/lib/actions/social";
import { inviteToCommunityAction } from "@/lib/actions/communities";
import { resolveThemeColor } from "@/lib/communities/theme";
import { prisma } from "@/lib/prisma";
import { listVoiceRooms } from "@/lib/voice/queries";
import { VoiceRoomsSection } from "@/components/voice/voice-rooms-section";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function CommunityPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const { tab = "posts" } = await searchParams;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.communities");
  const loc = await getLocale();

  const community = await prisma.community.findUnique({
    where: { slug },
    include: {
      _count: { select: { members: true } },
      members: {
        include: { profile: { include: { role: true, skills: { include: { skill: true }, take: 3 } } } },
      },
    },
  });
  if (!community) notFound();

  const myMembership = community.members.find((m) => m.profileId === me.id);
  const joined = Boolean(myMembership);
  const canInvite = joined;
  const name = loc === "ar" ? community.nameAr : community.nameEn;
  const identity = {
    slug: community.slug,
    name,
    themeColor: resolveThemeColor(community.slug, community.themeColor),
    imageUrl: community.imageUrl,
  };

  const voiceRooms =
    tab === "voice" ? await listVoiceRooms(me.id, { communityId: community.id }) : [];

  const posts = await prisma.post.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: { include: { role: true } },
      community: {
        select: { slug: true, nameAr: true, nameEn: true, themeColor: true, imageUrl: true },
      },
      tags: { include: { tag: true } },
      comments: { take: 4, include: { author: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { profileId: me.id } },
      savedBy: { where: { profileId: me.id } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <header className="overflow-hidden rounded-xl border border-border bg-surface">
        <CommunityBanner community={identity} />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-3">
            <CommunityAvatar community={identity} size="xl" />
            {community.isOpen || joined ? (
              myMembership?.role === "owner" || community.createdById === me.id ? null : (
              <form action={toggleCommunityMembershipAction.bind(null, community.id)}>
                <Button type="submit" variant={joined ? "secondary" : "primary"} size="sm">
                  {joined ? t("leave") : t("join")}
                </Button>
              </form>
              )
            ) : (
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                {t("inviteOnly")}
              </span>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-semibold">{name}</h1>
          <p className="mt-2 text-sm text-secondary">{community.description}</p>
          <p className="mt-2 text-xs text-muted">{t("members", { count: community._count.members })}</p>
        </div>
      </header>
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {["posts", "members", "voice", "about"].map((id) => (
          <Link
            key={id}
            href={`/app/communities/${slug}?tab=${id}` as never}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${tab === id ? "border-accent bg-accent-muted" : "border-border"}`}
          >
            {id === "posts"
              ? t("posts")
              : id === "members"
                ? t("members", { count: community._count.members })
                : id === "voice"
                  ? t("voice")
                  : t("about")}
          </Link>
        ))}
      </div>
      {tab === "posts" ? (
        <div className="mt-4 space-y-3">
          {joined ? (
            <PostComposer
              communityId={community.id}
              accent={resolveThemeColor(community.slug, community.themeColor)}
            />
          ) : null}
          {posts.map((post) => (
            <PostCard
              key={post.id}
              currentUserId={me.id}
              post={{ ...post, liked: post.likes.length > 0, saved: post.savedBy.length > 0 }}
            />
          ))}
        </div>
      ) : null}
      {tab === "members" ? (
        <div className="mt-4 space-y-4">
          {canInvite ? (
            <form
              action={inviteToCommunityAction.bind(null, community.id)}
              className="space-y-2 rounded-xl border border-border p-4"
            >
              <p className="text-sm font-semibold">{t("invite")}</p>
              <input
                name="username"
                required
                placeholder="@username"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm dir-ltr"
              />
              <textarea
                name="message"
                rows={2}
                placeholder={t("inviteMessage")}
                className="w-full rounded-md border border-border bg-background p-3 text-sm"
              />
              <Button type="submit" size="sm">
                {t("sendInvite")}
              </Button>
            </form>
          ) : null}
          <ul className="space-y-2">
            {community.members.map((m) => (
              <li key={m.profileId} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <Avatar name={m.profile.fullName} src={m.profile.avatarUrl} />
                  <div>
                    <p className="font-medium">{m.profile.fullName}</p>
                    <p className="text-xs text-muted">{m.role}</p>
                  </div>
                </div>
                <DeveloperActions
                  profileId={m.profileId}
                  username={m.profile.username}
                  isFollowing={false}
                  isSelf={m.profileId === me.id}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {tab === "about" ? (
        <p className="mt-4 text-sm leading-7 text-secondary">{community.description}</p>
      ) : null}
      {tab === "voice" ? (
        <VoiceRoomsSection
          rooms={voiceRooms}
          createHref={joined ? `/app/voice/create?community=${community.id}&type=COMMUNITY` : undefined}
        />
      ) : null}
    </div>
  );
}
