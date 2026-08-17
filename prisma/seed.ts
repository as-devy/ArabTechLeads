import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/auth/password";
import { COMMUNITY_THEMES } from "../lib/communities/theme";
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

const DEMO_PASSWORD = "DemoPass123!";
const DEMO_DOMAIN = "demo.arabtechleads.dev";

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
  {
    slug: "flutter",
    nameAr: "مطورو Flutter",
    nameEn: "Flutter Developers",
    description: "Cross-platform apps with Flutter and Dart.",
    icon: "smartphone",
    isFeatured: false,
  },
  {
    slug: "python",
    nameAr: "مطورو Python",
    nameEn: "Python Developers",
    description: "Python for APIs, data, and automation.",
    icon: "code",
    isFeatured: false,
  },
];

const demoPeople = [
  {
    email: `sara@${DEMO_DOMAIN}`,
    name: "Sara Khalil",
    username: "sara_khalil",
    bio: "Frontend engineer focusing on React and accessible Arabic interfaces.",
    roleId: "frontend_developer",
    country: "EG",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    interests: ["open-source", "startups"],
  },
  {
    email: `ahmed@${DEMO_DOMAIN}`,
    name: "Ahmed Nasser",
    username: "ahmed_nasser",
    bio: "Backend engineer. PostgreSQL, APIs, and clean architecture.",
    roleId: "backend_developer",
    country: "SA",
    skills: ["Node.js", "PostgreSQL", "Prisma", "TypeScript"],
    interests: ["web-development", "cloud"],
  },
  {
    email: `layla@${DEMO_DOMAIN}`,
    name: "Layla Omar",
    username: "layla_omar",
    bio: "Product designer for developer tools and bilingual products.",
    roleId: "uiux_designer",
    country: "AE",
    skills: ["Figma", "React"],
    interests: ["uiux", "startups"],
  },
  {
    email: `karim@${DEMO_DOMAIN}`,
    name: "Karim Hassan",
    username: "karim_hassan",
    bio: "Application security. Reviews auth, RLS, and threat models.",
    roleId: "cybersecurity_engineer",
    country: "JO",
    skills: ["Linux", "Docker", "AWS"],
    interests: ["cybersecurity", "cloud"],
  },
  {
    email: `nouria@${DEMO_DOMAIN}`,
    name: "Nouria Benali",
    username: "nouria_benali",
    bio: "ML engineer working on Arabic NLP and practical LLM apps.",
    roleId: "ai_engineer",
    country: "MA",
    skills: ["Python", "FastAPI", "PostgreSQL"],
    interests: ["ai", "open-source"],
  },
  {
    email: `yusuf@${DEMO_DOMAIN}`,
    name: "Yusuf Ali",
    username: "yusuf_ali",
    bio: "DevOps. CI/CD, containers, and cloud platforms.",
    roleId: "devops_engineer",
    country: "KW",
    skills: ["Docker", "Kubernetes", "AWS", "Linux"],
    interests: ["devops", "cloud"],
  },
];

type CommunityPostSeed = {
  community: string;
  author: string;
  content: string;
  code?: string;
  language?: string;
  comment?: string;
};

const communityPosts: CommunityPostSeed[] = [
  {
    community: "react",
    author: "sara_khalil",
    content:
      "ما أفضل طريقة لإدارة الحالة في نموذج عربي مع validation؟ أفكر في React Hook Form.",
    comment: "Hook Form مع Zod يعمل ممتاز مع RTL.",
  },
  {
    community: "react",
    author: "layla_omar",
    content: "شاركوا مكتبات UI التي تحترمون فيها الاتجاه المنطقي (start/end) بدل left/right.",
  },
  {
    community: "nextjs",
    author: "ahmed_nasser",
    content: "هل توجد طريقة أفضل لتحسين هذا الاستعلام في Server Action؟",
    code: `const result = await prisma.profile.findMany({
  where: { onboardingCompleted: true },
  include: { skills: { include: { skill: true } } },
  take: 20,
});`,
    language: "TypeScript",
    comment: "أضف فهرسًا على onboarding_completed إن كان الفلتر شائعًا.",
  },
  {
    community: "nextjs",
    author: "sara_khalil",
    content: "App Router + next-intl: localePrefix as-needed اختصر روابط العربية كثيرًا.",
  },
  {
    community: "backend",
    author: "ahmed_nasser",
    content: "نصيحة: لا تثق بـ user_id من العميل. تحقق من الجلسة على الخادم دائمًا.",
  },
  {
    community: "backend",
    author: "karim_hassan",
    content: "عند تصميم RLS، ابدأ بسياسات القراءة ثم أضف الكتابة بحذر.",
    code: `create policy "posts_insert_own"
  on public.posts for insert
  with check (author_id = auth.uid());`,
    language: "SQL",
  },
  {
    community: "cybersecurity",
    author: "karim_hassan",
    content: "تذكير سريع: لا تخزّن مفاتيح GitHub أو service role في المتصفح أبدًا.",
  },
  {
    community: "cybersecurity",
    author: "yusuf_ali",
    content: "Secrets في GitHub Actions عبر repository secrets فقط، مع least privilege.",
  },
  {
    community: "ai-ml",
    author: "nouria_benali",
    content:
      "للعربية: جرّب نماذج متعددة اللغات أولًا، ثم خصّص إن احتجت دقة أعلى للمصطلحات التقنية.",
  },
  {
    community: "ai-ml",
    author: "ahmed_nasser",
    content: "كيف تربطون RAG بمحتوى مجتمعي دون تسريب بيانات خاصة؟",
  },
  {
    community: "devops",
    author: "yusuf_ali",
    content: "قالب CI بسيط لـ Next.js: lint + tsc + build على كل PR.",
    code: `name: ci
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm i --frozen-lockfile
      - run: pnpm exec tsc --noEmit`,
    language: "Bash",
  },
  {
    community: "devops",
    author: "karim_hassan",
    content: "Docker غير root user في الإنتاج يقلل سطح الهجوم بشكل واضح.",
  },
  {
    community: "uiux",
    author: "layla_omar",
    content: "في المنتجات العربية: ابدأ بالمحتوى الحقيقي، لا بـ Lorem Ipsum اللاتيني.",
  },
  {
    community: "uiux",
    author: "sara_khalil",
    content: "Focus rings يجب أن تبقى واضحة في الوضع الداكن على خلفيات #07070a.",
  },
  {
    community: "open-source",
    author: "nouria_benali",
    content: "ابحثوا عن issues بعنوان good first issue في مكتبات التوثيق العربية.",
  },
  {
    community: "open-source",
    author: "yusuf_ali",
    content: "CONTRIBUTING.md ثنائي اللغة يزيد مساهمات المجتمع بشكل ملحوظ.",
  },
  {
    community: "flutter",
    author: "sara_khalil",
    content: "Directionality و locale في Flutter يجب ضبطهما من أول MaterialApp.",
  },
  {
    community: "flutter",
    author: "layla_omar",
    content: "صمموا شاشات الجوال بـ 8pt grid حتى لا تتكدس النصوص العربية.",
  },
  {
    community: "python",
    author: "nouria_benali",
    content: "FastAPI + Pydantic v2 ممتاز لواجهات خدمات الـ ML.",
    code: `from fastapi import FastAPI
from pydantic import BaseModel

class PredictIn(BaseModel):
    text: str

app = FastAPI()

@app.post("/predict")
def predict(body: PredictIn):
    return {"ok": True, "chars": len(body.text)}`,
    language: "Python",
  },
  {
    community: "python",
    author: "ahmed_nasser",
    content: "SQLAlchemy 2.0 style أفضل من الـ legacy query API للمشاريع الجديدة.",
  },
];

const feedPosts = [
  {
    author: "sara_khalil",
    content: "صباح الخير. أعمل اليوم على تحسين تغذية ArabTechLeads للموبايل.",
  },
  {
    author: "ahmed_nasser",
    content: "من أنهى onboarding اليوم؟ شاركونا تخصصاتكم لنوصلكم بمجتمعات مناسبة.",
  },
  {
    author: "layla_omar",
    content: "قاعدة بسيطة: البطاقة تعرض معلومة واحدة قوية، لا عشر شارات.",
  },
];

async function seedTaxonomy() {
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
        themeColor: COMMUNITY_THEMES[community.slug] ?? "#0284c7",
      },
      create: {
        ...community,
        themeColor: COMMUNITY_THEMES[community.slug] ?? "#0284c7",
      },
    });
  }
}

async function seedDemoPeople() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const profiles: Record<string, string> = {};

  for (const person of demoPeople) {
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: { name: person.name, passwordHash },
      create: {
        email: person.email,
        name: person.name,
        passwordHash,
      },
    });

    const profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        email: person.email,
        username: person.username,
        fullName: person.name,
        bio: person.bio,
        roleId: person.roleId,
        countryCode: person.country,
        onboardingCompleted: true,
        locale: "ar",
        isAdmin: person.username === "sara_khalil",
      },
      create: {
        id: user.id,
        email: person.email,
        username: person.username,
        fullName: person.name,
        bio: person.bio,
        roleId: person.roleId,
        countryCode: person.country,
        onboardingCompleted: true,
        locale: "ar",
        isAdmin: person.username === "sara_khalil",
      },
    });

    await prisma.profileRole.deleteMany({ where: { profileId: profile.id } });
    await prisma.profileRole.create({
      data: { profileId: profile.id, roleId: person.roleId },
    });

    const skillRows = await prisma.skill.findMany({
      where: { name: { in: person.skills } },
    });
    await prisma.profileSkill.deleteMany({ where: { profileId: profile.id } });
    if (skillRows.length) {
      await prisma.profileSkill.createMany({
        data: skillRows.map((s) => ({ profileId: profile.id, skillId: s.id })),
      });
    }

    const interestRows = await prisma.interest.findMany({
      where: { slug: { in: person.interests } },
    });
    await prisma.profileInterest.deleteMany({ where: { profileId: profile.id } });
    if (interestRows.length) {
      await prisma.profileInterest.createMany({
        data: interestRows.map((i) => ({
          profileId: profile.id,
          interestId: i.id,
        })),
      });
    }

    profiles[person.username] = profile.id;
  }

  return profiles;
}

async function seedMemberships(profiles: Record<string, string>) {
  const allCommunities = await prisma.community.findMany();
  const ids = Object.values(profiles);

  for (const community of allCommunities) {
    for (const profileId of ids) {
      await prisma.communityMember.upsert({
        where: {
          communityId_profileId: { communityId: community.id, profileId },
        },
        update: {},
        create: { communityId: community.id, profileId },
      });
    }
  }

  const existing = await prisma.profile.findMany({
    where: {
      onboardingCompleted: true,
      email: { not: { endsWith: `@${DEMO_DOMAIN}` } },
    },
    select: { id: true },
  });

  for (const viewer of existing) {
    for (const demoId of ids) {
      if (viewer.id === demoId) continue;
      await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: viewer.id,
            followingId: demoId,
          },
        },
        update: {},
        create: { followerId: viewer.id, followingId: demoId },
      });
    }
  }

  const demoIds = ids;
  for (let i = 0; i < demoIds.length; i++) {
    const next = demoIds[(i + 1) % demoIds.length];
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: demoIds[i],
          followingId: next,
        },
      },
      update: {},
      create: { followerId: demoIds[i], followingId: next },
    });
  }

  await prisma.connection.upsert({
    where: {
      requesterId_receiverId: {
        requesterId: profiles.sara_khalil,
        receiverId: profiles.ahmed_nasser,
      },
    },
    update: { status: "ACCEPTED" },
    create: {
      requesterId: profiles.sara_khalil,
      receiverId: profiles.ahmed_nasser,
      status: "ACCEPTED",
    },
  });
}

async function seedPosts(profiles: Record<string, string>) {
  const demoIds = Object.values(profiles);
  await prisma.post.deleteMany({ where: { authorId: { in: demoIds } } });

  const communityRows = await prisma.community.findMany();
  const bySlug = Object.fromEntries(communityRows.map((c) => [c.slug, c]));

  for (const item of communityPosts) {
    const authorId = profiles[item.author];
    const community = bySlug[item.community];
    if (!authorId || !community) continue;

    const post = await prisma.post.create({
      data: {
        authorId,
        communityId: community.id,
        type: item.code ? "CODE" : "TEXT",
        content: item.content,
        code: item.code ?? null,
        language: item.language ?? null,
      },
    });

    await prisma.communityPost.create({
      data: { communityId: community.id, postId: post.id },
    });

    if (item.comment) {
      const commenter =
        demoIds.find((id) => id !== authorId) ?? authorId;
      await prisma.comment.create({
        data: { postId: post.id, authorId: commenter, content: item.comment },
      });
    }

    const liker = demoIds.find((id) => id !== authorId);
    if (liker) {
      await prisma.postLike.create({
        data: { postId: post.id, profileId: liker },
      });
    }
  }

  for (const item of feedPosts) {
    await prisma.post.create({
      data: {
        authorId: profiles[item.author],
        type: "TEXT",
        content: item.content,
      },
    });
  }
}

async function seedProjects(profiles: Record<string, string>) {
  const demoIds = Object.values(profiles);
  await prisma.project.deleteMany({ where: { ownerId: { in: demoIds } } });

  const nextSkill = await prisma.skill.findUnique({ where: { slug: "next-js" } });
  const tsSkill = await prisma.skill.findUnique({ where: { slug: "typescript" } });
  const prismaSkill = await prisma.skill.findUnique({ where: { slug: "prisma" } });
  const pythonSkill = await prisma.skill.findUnique({ where: { slug: "python" } });

  const atl = await prisma.project.create({
    data: {
      ownerId: profiles.sara_khalil,
      name: "ArabTechLeads",
      slug: "arabtechleads-community",
      shortDescription:
        "منصة اجتماعية للمطورين العرب لبناء شبكة تقنية والتعاون على المشاريع.",
      description:
        "ArabTechLeads يجمع المطورين العرب للتواصل، مشاركة الكود، وبناء مشاريع حقيقية معًا.",
      projectType: "COMMUNITY",
      status: "IN_PROGRESS",
      collaborationStatus: "LOOKING",
      githubUrl: "https://github.com/vercel/next.js",
      githubOwner: "vercel",
      githubRepo: "next.js",
      members: {
        create: [
          { profileId: profiles.sara_khalil, roleName: "owner" },
          { profileId: profiles.ahmed_nasser, roleName: "Backend Developer" },
          { profileId: profiles.layla_omar, roleName: "UI/UX Designer" },
        ],
      },
      roles: {
        create: [
          {
            name: "Frontend Developer",
            requiredSkills: ["React", "Next.js", "TypeScript"],
            positions: 1,
          },
          {
            name: "UI/UX Designer",
            requiredSkills: ["Figma"],
            positions: 1,
            filledPositions: 1,
          },
        ],
      },
      technologies: {
        create: [nextSkill, tsSkill, prismaSkill]
          .filter(Boolean)
          .map((s) => ({ skillId: s!.id })),
      },
      tasks: {
        create: [
          {
            creatorId: profiles.sara_khalil,
            assigneeId: profiles.ahmed_nasser,
            title: "Build developer profile",
            status: "IN_PROGRESS",
            priority: "HIGH",
          },
          {
            creatorId: profiles.sara_khalil,
            title: "Create authentication UI",
            status: "DONE",
            priority: "MEDIUM",
          },
          {
            creatorId: profiles.ahmed_nasser,
            title: "Review database schema",
            status: "REVIEW",
            priority: "MEDIUM",
          },
          {
            creatorId: profiles.layla_omar,
            title: "Polish project cards",
            status: "TODO",
            priority: "LOW",
          },
        ],
      },
      discussions: {
        create: {
          authorId: profiles.ahmed_nasser,
          title: "Should we use Zustand or React Context?",
          content: "For Stage 3 workspace state, context may be enough. What do you think?",
        },
      },
      activities: {
        create: [
          {
            actorId: profiles.sara_khalil,
            type: "created",
            message: "created the project",
          },
          {
            actorId: profiles.ahmed_nasser,
            type: "joined",
            message: "joined the project",
          },
        ],
      },
    },
  });

  await prisma.projectShowcase.createMany({
    data: [
      { profileId: profiles.sara_khalil, projectId: atl.id, pinned: true },
      { profileId: profiles.ahmed_nasser, projectId: atl.id, pinned: false },
    ],
  });

  await prisma.project.create({
    data: {
      ownerId: profiles.nouria_benali,
      name: "Arabic NLP Starter",
      slug: "arabic-nlp-starter",
      shortDescription: "أدوات مفتوحة المصدر لمعالجة النصوص العربية.",
      description: "Tokenizer بسيط، أمثلة FastAPI، ودفتر Jupyter للتجربة.",
      projectType: "OPEN_SOURCE",
      status: "PLANNING",
      collaborationStatus: "LOOKING",
      members: {
        create: { profileId: profiles.nouria_benali, roleName: "owner" },
      },
      roles: {
        create: {
          name: "AI Engineer",
          requiredSkills: ["Python"],
          positions: 2,
        },
      },
      technologies: pythonSkill
        ? { create: { skillId: pythonSkill.id } }
        : undefined,
    },
  });
}

async function seedOpportunities(profiles: Record<string, string>) {
  const company = await prisma.company.upsert({
    where: { slug: "nile-labs" },
    update: {},
    create: {
      name: "Nile Labs",
      slug: "nile-labs",
      description: "Product studio building developer tools for the MENA region.",
      industry: "Software",
      location: "Cairo / Remote",
      website: "https://example.com",
      verificationStatus: "VERIFIED",
      createdById: profiles.ahmed_nasser,
      members: { create: { profileId: profiles.ahmed_nasser, role: "owner" } },
    },
  });

  await prisma.job.upsert({
    where: { slug: "senior-fullstack-nile" },
    update: {},
    create: {
      companyId: company.id,
      createdById: profiles.ahmed_nasser,
      title: "Senior Full Stack Developer",
      slug: "senior-fullstack-nile",
      description:
        "Build community and collaboration products with Next.js, TypeScript, and PostgreSQL.",
      employmentType: "FULL_TIME",
      workMode: "REMOTE",
      location: "Egypt / MENA",
      experienceLevel: "Senior",
    },
  });

  await prisma.freelanceOpportunity.upsert({
    where: { slug: "nextjs-dashboard" },
    update: {},
    create: {
      creatorId: profiles.layla_omar,
      title: "مطلوب مطور Next.js لبناء لوحة تحكم",
      slug: "nextjs-dashboard",
      description: "لوحة تحكم عربية RTL مع Tailwind وSupabase.",
      budgetMin: 500,
      budgetMax: 1000,
      duration: "2–4 weeks",
    },
  });

  await prisma.mentorProfile.upsert({
    where: { profileId: profiles.ahmed_nasser },
    update: { isActive: true },
    create: {
      profileId: profiles.ahmed_nasser,
      bio: "Mentoring Next.js, Node.js, and system design in Arabic and English.",
      topics: ["Next.js", "Node.js", "System Design"],
      languages: ["العربية", "English"],
      isActive: true,
    },
  });

  await prisma.profile.update({
    where: { id: profiles.ahmed_nasser },
    data: {
      openToMentorship: true,
      openToWork: true,
      headline: "Backend engineer · mentor",
    },
  });

  await prisma.event.upsert({
    where: { slug: "nextjs-cairo-meetup" },
    update: {},
    create: {
      organizerId: profiles.sara_khalil,
      title: "Next.js Cairo Meetup",
      slug: "nextjs-cairo-meetup",
      description: "Talks about App Router, Server Actions, and Arabic-first UX.",
      startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      location: "Cairo",
      isOnline: false,
    },
  });

  await prisma.hackathon.upsert({
    where: { slug: "arab-ai-weekend" },
    update: {},
    create: {
      organizerId: profiles.nouria_benali,
      title: "Arab AI Weekend",
      slug: "arab-ai-weekend",
      description: "Build practical Arabic NLP tools in 48 hours.",
      startAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
      prizeDescription: "Cloud credits + mentorship",
    },
  });
}

async function main() {
  await seedTaxonomy();
  const profiles = await seedDemoPeople();
  await seedMemberships(profiles);
  await seedPosts(profiles);
  await seedProjects(profiles);
  await seedOpportunities(profiles);

  console.log("Seed complete.");
  console.log(`Demo login password for all demo users: ${DEMO_PASSWORD}`);
  console.log(`Example: sara@${DEMO_DOMAIN}`);
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
