import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { DeveloperActions } from "@/components/developers/developer-actions";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; role?: string; country?: string }>;
};

export default async function DevelopersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q, role, country } = await searchParams;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.developers");

  const mySkillIds = me.skills.map((s) => s.skillId);

  const developers = await prisma.profile.findMany({
    where: {
      id: { not: me.id },
      onboardingCompleted: true,
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { username: { contains: q, mode: "insensitive" } },
              { bio: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(role ? { roleId: role } : {}),
      ...(country ? { countryCode: country } : {}),
    },
    take: 40,
    include: {
      role: true,
      country: true,
      skills: { include: { skill: true }, take: 5 },
      interests: { include: { interest: true }, take: 3 },
    },
  });

  const follows = await prisma.follow.findMany({
    where: { followerId: me.id },
    select: { followingId: true },
  });
  const followingSet = new Set(follows.map((f) => f.followingId));

  const roles = await prisma.role.findMany({ orderBy: { nameEn: "asc" } });
  const countries = await prisma.country.findMany({ orderBy: { nameEn: "asc" } });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <form className="mt-4 grid gap-2 sm:grid-cols-4">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("search")}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        />
        <select name="role" defaultValue={role ?? ""} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
          <option value="">Role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {locale === "ar" ? r.nameAr : r.nameEn}
            </option>
          ))}
        </select>
        <select name="country" defaultValue={country ?? ""} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
          <option value="">Country</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {locale === "ar" ? c.nameAr : c.nameEn}
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-md bg-accent text-sm text-white">
          {t("search")}
        </button>
      </form>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {developers.length === 0 ? (
          <p className="text-sm text-secondary">{t("empty")}</p>
        ) : (
          developers.map((dev) => {
            const shared = dev.skills.filter((s) => mySkillIds.includes(s.skillId)).length;
            return (
              <article key={dev.id} className="rounded-xl border border-border p-4">
                <div className="flex gap-3">
                  <Avatar name={dev.fullName} src={dev.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{dev.fullName}</p>
                    <p className="text-xs text-muted dir-ltr">@{dev.username}</p>
                    <p className="text-xs text-secondary">
                      {locale === "ar" ? dev.role?.nameAr : dev.role?.nameEn}
                    </p>
                    {dev.bio ? (
                      <p className="mt-2 line-clamp-2 text-sm text-secondary">{dev.bio}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {dev.skills.map((s) => (
                        <span key={s.skillId} className="rounded bg-accent-muted px-1.5 py-0.5 text-[11px]">
                          {s.skill.name}
                        </span>
                      ))}
                    </div>
                    {shared > 0 ? (
                      <p className="mt-2 text-xs text-muted">
                        {t("sharedSkills", { count: shared })}
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <DeveloperActions
                        profileId={dev.id}
                        username={dev.username}
                        isFollowing={followingSet.has(dev.id)}
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
