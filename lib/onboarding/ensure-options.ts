import {
  ARAB_COUNTRIES,
  INTERESTS,
  ROLES,
  SKILLS,
  slugify,
} from "@/lib/constants/taxonomy";
import { prisma } from "@/lib/prisma";

export async function ensureOnboardingOptions() {
  await Promise.all([
    ...ROLES.map((role) =>
      prisma.role.upsert({
        where: { id: role.id },
        update: { nameAr: role.nameAr, nameEn: role.nameEn },
        create: {
          id: role.id,
          nameAr: role.nameAr,
          nameEn: role.nameEn,
        },
      }),
    ),
    ...SKILLS.map((name) => {
      const slug = slugify(name);
      return prisma.skill.upsert({
        where: { slug },
        update: { name },
        create: { slug, name },
      });
    }),
    ...INTERESTS.map((interest) =>
      prisma.interest.upsert({
        where: { slug: interest.slug },
        update: { nameAr: interest.nameAr, nameEn: interest.nameEn },
        create: {
          slug: interest.slug,
          nameAr: interest.nameAr,
          nameEn: interest.nameEn,
        },
      }),
    ),
    ...ARAB_COUNTRIES.map((country) =>
      prisma.country.upsert({
        where: { code: country.code },
        update: { nameAr: country.nameAr, nameEn: country.nameEn },
        create: {
          code: country.code,
          nameAr: country.nameAr,
          nameEn: country.nameEn,
        },
      }),
    ),
  ]);
}
