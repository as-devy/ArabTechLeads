import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ARAB_COUNTRIES, ROLES } from "@/lib/constants/taxonomy";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OnboardingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      skills: true,
      interests: true,
    },
  });

  if (profile?.onboardingCompleted) {
    redirect("/app");
  }

  const [dbRoles, dbSkills, dbInterests, dbCountries] = await Promise.all([
    prisma.role.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.skill.findMany({ orderBy: { name: "asc" } }),
    prisma.interest.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.country.findMany({ orderBy: { nameEn: "asc" } }),
  ]);

  const roles =
    dbRoles.length > 0
      ? dbRoles.map((r) => ({
          id: r.id,
          nameAr: r.nameAr,
          nameEn: r.nameEn,
        }))
      : ROLES.map((r) => ({ id: r.id, nameAr: r.nameAr, nameEn: r.nameEn }));

  const countries =
    dbCountries.length > 0
      ? dbCountries.map((c) => ({
          code: c.code,
          nameAr: c.nameAr,
          nameEn: c.nameEn,
        }))
      : ARAB_COUNTRIES.map((c) => ({
          code: c.code,
          nameAr: c.nameAr,
          nameEn: c.nameEn,
        }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <OnboardingWizard
        roles={roles}
        skills={dbSkills.map((s) => ({ id: s.id, name: s.name }))}
        interests={dbInterests.map((i) => ({
          id: i.id,
          nameAr: i.nameAr,
          nameEn: i.nameEn,
        }))}
        countries={countries}
        initial={{
          fullName: profile?.fullName,
          username: profile?.username,
          avatarUrl: profile?.avatarUrl,
          bio: profile?.bio,
          roleId: profile?.roleId,
          countryCode: profile?.countryCode,
          skillIds: profile?.skills.map((s) => s.skillId) ?? [],
          interestIds: profile?.interests.map((i) => i.interestId) ?? [],
        }}
      />
    </div>
  );
}
