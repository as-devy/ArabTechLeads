import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { ActiveCommunitiesCard } from "@/components/communities/active-communities-card";
import { LiveFeed } from "@/components/posts/live-feed";
import { PostComposer } from "@/components/posts/post-composer";
import { Avatar } from "@/components/ui/avatar";
import { getCurrentProfile, getSessionUser } from "@/lib/auth/session";
import { getPersonalizedFeed } from "@/lib/feed/feed-service";
import { prisma } from "@/lib/prisma";
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

  const [{ posts, nextCursor, hasMore }, suggestions, communities] = await Promise.all([
    getPersonalizedFeed({ userId: profile.id }),
    prisma.profile.findMany({
      where: {
        id: { not: profile.id },
        onboardingCompleted: true,
        username: { not: null },
      },
      take: 4,
      include: { role: true, skills: { include: { skill: true }, take: 3 } },
    }),
    prisma.community.findMany({
      take: 5,
      include: { _count: { select: { members: true } } },
      orderBy: [{ isFeatured: "desc" }, { nameEn: "asc" }],
    }),
  ]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-6">
      <section>
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">
          {t("feed.title")}
        </h1>
        <p className="mb-4 text-sm text-secondary">{t("feed.forYou")}</p>
        <PostComposer />
        <div className="mt-4">
          <LiveFeed
            currentUserId={profile.id}
            scope={{ kind: "personalized" }}
            posts={posts}
            nextCursor={nextCursor}
            hasMore={hasMore}
            empty={
              <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-secondary">
                {t("feed.empty")}
              </p>
            }
          />
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
