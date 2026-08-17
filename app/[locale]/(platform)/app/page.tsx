import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { ActiveCommunitiesCard } from "@/components/communities/active-communities-card";
import { PostCard } from "@/components/posts/post-card";
import { PostComposer } from "@/components/posts/post-composer";
import { Avatar } from "@/components/ui/avatar";
import { getCurrentProfile, getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { mutedIds } from "@/lib/trust/moderation";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AppHomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (profile && !profile.onboardingCompleted) redirect("/onboarding");
  if (!profile) redirect("/onboarding");

  const t = await getTranslations("app");

  const following = await prisma.follow.findMany({
    where: { followerId: profile.id },
    select: { followingId: true },
  });
  const mutedUsers = await mutedIds(profile.id, "user");
  const authorIds = [profile.id, ...following.map((f) => f.followingId)].filter(
    (id) => !mutedUsers.includes(id) || id === profile.id,
  );

  const posts = await prisma.post.findMany({
    where: { authorId: { in: authorIds } },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
        author: { include: { role: true } },
        community: {
          select: { slug: true, nameAr: true, nameEn: true, themeColor: true, imageUrl: true },
        },
        tags: { include: { tag: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        take: 8,
        include: { author: true },
      },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { profileId: profile.id }, select: { profileId: true } },
      savedBy: { where: { profileId: profile.id }, select: { profileId: true } },
    },
  });

  const suggestions = await prisma.profile.findMany({
    where: {
      id: { not: profile.id },
      onboardingCompleted: true,
      username: { not: null },
    },
    take: 4,
    include: { role: true, skills: { include: { skill: true }, take: 3 } },
  });

  const communities = await prisma.community.findMany({
    take: 5,
    include: { _count: { select: { members: true } } },
    orderBy: [{ isFeatured: "desc" }, { nameEn: "asc" }],
  });

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-6">
      <section>
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">
          {t("feed.title")}
        </h1>
        <PostComposer />
        <div className="mt-4 space-y-3">
          {posts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-secondary">
              {t("feed.empty")}
            </p>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                currentUserId={profile.id}
                post={{
                  ...post,
                  liked: post.likes.length > 0,
                  saved: post.savedBy.length > 0,
                }}
              />
            ))
          )}
        </div>
      </section>
      <aside className="hidden space-y-5 lg:block">
        <div className="rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold">{t("rightRail.suggested")}</h2>
          <ul className="mt-3 space-y-2">
            {suggestions.map((dev) => (
              <li key={dev.id}>
                <Link
                  href={`/app/developers/${dev.username}` as never}
                  className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-accent-muted/50"
                >
                  <Avatar name={dev.fullName} src={dev.avatarUrl} size="sm" />
                  <span className="min-w-0 flex-1 text-start">
                    <span className="block truncate text-sm font-medium">{dev.fullName}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      <span dir="ltr" className="inline-block">
                        @{dev.username}
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <ActiveCommunitiesCard communities={communities} />
      </aside>
    </div>
  );
}
