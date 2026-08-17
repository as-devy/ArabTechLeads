import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CommunityAvatar } from "@/components/communities/community-identity";

type Community = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr?: string;
  themeColor?: string;
  imageUrl?: string | null;
  icon: string | null;
  _count: { members: number };
};

export async function ActiveCommunitiesCard({
  communities,
}: {
  communities: Community[];
}) {
  const t = await getTranslations("app.rightRail");

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <header className="border-b border-border px-4 py-3">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted">
          {t("discover")}
        </p>
        <h2 className="mt-1 text-sm font-semibold text-foreground">
          {t("communities")}
        </h2>
      </header>
      <ul>
        {communities.map((community) => (
          <li key={community.id} className="border-b border-border last:border-b-0">
            <Link
              href={`/app/communities/${community.slug}` as never}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent-muted/40"
            >
              <CommunityAvatar
                community={{
                  slug: community.slug,
                  name: community.nameEn,
                  themeColor: community.themeColor ?? "#0284c7",
                  imageUrl: community.imageUrl,
                }}
                size="sm"
                className="rounded-xl"
              />
              <span className="min-w-0 flex-1">
                <span className="dir-ltr block truncate text-start text-sm font-medium text-foreground">
                  {community.nameEn}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted">
                  {t("members", { count: community._count.members })}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
