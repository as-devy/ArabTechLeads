import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { PostCard } from "@/components/posts/post-card";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function ExplorePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const t = await getTranslations("app.explore");
  const loc = await getLocale();

  const [posts, developers, communities, codePosts] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        author: { include: { role: true } },
        community: {
          select: { slug: true, nameAr: true, nameEn: true, themeColor: true, imageUrl: true },
        },
        tags: { include: { tag: true } },
        comments: { take: 4, include: { author: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { profileId: profile.id } },
        savedBy: { where: { profileId: profile.id } },
      },
    }),
    prisma.profile.findMany({
      where: { id: { not: profile.id }, onboardingCompleted: true },
      take: 8,
      include: { role: true, skills: { include: { skill: true }, take: 4 } },
    }),
    prisma.community.findMany({
      take: 8,
      include: { _count: { select: { members: true } } },
    }),
    prisma.post.findMany({
      where: { type: "CODE" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        author: { include: { role: true } },
        community: {
          select: { slug: true, nameAr: true, nameEn: true, themeColor: true, imageUrl: true },
        },
        tags: { include: { tag: true } },
        comments: { take: 2, include: { author: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { profileId: profile.id } },
        savedBy: { where: { profileId: profile.id } },
      },
    }),
  ]);

  const tabs = [
    t("forYou"),
    t("trending"),
    t("latest"),
    t("developers"),
    t("code"),
    t("communities"),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab, i) => (
          <span
            key={tab}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${i === 0 ? "border-accent bg-accent-muted" : "border-border text-secondary"}`}
          >
            {tab}
          </span>
        ))}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold">{t("suggestedDevelopers")}</h2>
          <ul className="space-y-2">
            {developers.map((dev) => (
              <li key={dev.id} className="rounded-lg border border-border p-3">
                <Link href={`/app/developers/${dev.username}` as never} className="font-medium">
                  {dev.fullName}
                </Link>
                <p className="text-xs text-muted dir-ltr">@{dev.username}</p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-sm font-semibold">{t("activeCommunities")}</h2>
          <ul className="space-y-2">
            {communities.map((c) => (
              <li key={c.id} className="rounded-lg border border-border p-3">
                <Link href={`/app/communities/${c.slug}` as never}>
                  {loc === "ar" ? c.nameAr : c.nameEn}
                </Link>
                <p className="text-xs text-muted">{c._count.members}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold">{t("trendingCode")}</h2>
        <div className="space-y-3">
          {codePosts.map((post) => (
            <PostCard
              key={post.id}
              currentUserId={profile.id}
              post={{ ...post, liked: post.likes.length > 0, saved: post.savedBy.length > 0 }}
            />
          ))}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold">{t("latest")}</h2>
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              currentUserId={profile.id}
              post={{ ...post, liked: post.likes.length > 0, saved: post.savedBy.length > 0 }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
