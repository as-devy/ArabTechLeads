import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { LiveFeed } from "@/components/posts/live-feed";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { toFeedPost } from "@/lib/posts/feed";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function SavedPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { tab = "all" } = await searchParams;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.saved");

  const saved = await prisma.savedPost.findMany({
    where: { profileId: me.id },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
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
      },
    },
  });

  const posts = saved
    .map((s) => s.post)
    .filter((p) => (tab === "code" ? p.type === "CODE" : tab === "posts" ? p.type === "TEXT" : true));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <div className="mt-4 flex gap-2">
        {[
          { id: "all", label: t("all") },
          { id: "posts", label: t("posts") },
          { id: "code", label: t("code") },
        ].map((item) => (
          <Link
            key={item.id}
            href={`/app/saved?tab=${item.id}` as never}
            className={`rounded-full border px-3 py-1.5 text-xs ${tab === item.id ? "border-accent bg-accent-muted" : "border-border"}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="mt-6">
        <LiveFeed
          currentUserId={me.id}
          scope={{ kind: "existing" }}
          posts={posts.map((post) => toFeedPost({ ...post, liked: post.likes.length > 0, saved: true }))}
          empty={
            <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
              <p className="font-medium">{t("emptyTitle")}</p>
              <p className="mt-2 text-sm text-secondary">{t("emptyBody")}</p>
            </div>
          }
        />
      </div>
    </div>
  );
}
