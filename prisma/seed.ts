import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  ARAB_COUNTRIES,
  INTERESTS,
  ROLES,
  SKILLS,
  slugify,
} from "../lib/constants/taxonomy";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const communities = [
  {
    slug: "react",
    nameAr: "مجتمع React",
    nameEn: "React Developers",
    description: "Components, patterns, and React best practices.",
    icon: "code",
    isFeatured: true,
  },
  {
    slug: "nextjs",
    nameAr: "مجتمع Next.js",
    nameEn: "Next.js Developers",
    description: "App Router, Server Actions, and performance.",
    icon: "boxes",
    isFeatured: true,
  },
  {
    slug: "backend",
    nameAr: "مطورو Backend",
    nameEn: "Backend Engineering",
    description: "APIs, databases, and distributed systems.",
    icon: "server",
    isFeatured: true,
  },
  {
    slug: "cybersecurity",
    nameAr: "الأمن السيبراني",
    nameEn: "Cybersecurity",
    description: "App security, vulnerabilities, and network defense.",
    icon: "lock",
    isFeatured: true,
  },
  {
    slug: "ai-ml",
    nameAr: "الذكاء الاصطناعي",
    nameEn: "AI & Machine Learning",
    description: "Models, data, and practical AI applications.",
    icon: "brain",
    isFeatured: true,
  },
  {
    slug: "devops",
    nameAr: "DevOps & Cloud",
    nameEn: "DevOps & Cloud",
    description: "CI/CD, infrastructure, and the cloud.",
    icon: "cloud",
    isFeatured: false,
  },
  {
    slug: "uiux",
    nameAr: "UI/UX",
    nameEn: "UI/UX",
    description: "Product design and digital experiences.",
    icon: "palette",
    isFeatured: false,
  },
  {
    slug: "open-source",
    nameAr: "Open Source",
    nameEn: "Open Source",
    description: "Contributions, libraries, and open projects.",
    icon: "terminal",
    isFeatured: false,
  },
];

async function main() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { nameAr: role.nameAr, nameEn: role.nameEn },
      create: role,
    });
  }

  for (const country of ARAB_COUNTRIES) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: { nameAr: country.nameAr, nameEn: country.nameEn },
      create: country,
    });
  }

  for (const skill of SKILLS) {
    const slug = slugify(skill);
    await prisma.skill.upsert({
      where: { slug },
      update: { name: skill },
      create: { slug, name: skill },
    });
  }

  for (const interest of INTERESTS) {
    await prisma.interest.upsert({
      where: { slug: interest.slug },
      update: { nameAr: interest.nameAr, nameEn: interest.nameEn },
      create: interest,
    });
  }

  for (const community of communities) {
    await prisma.community.upsert({
      where: { slug: community.slug },
      update: {
        nameAr: community.nameAr,
        nameEn: community.nameEn,
        description: community.description,
        icon: community.icon,
        isFeatured: community.isFeatured,
      },
      create: community,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
