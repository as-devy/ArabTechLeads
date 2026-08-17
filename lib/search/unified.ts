import { prisma } from "@/lib/prisma";

export async function unifiedSearch(q: string, take = 8) {
  const query = q.trim();
  if (!query) {
    return {
      developers: [],
      posts: [],
      projects: [],
      jobs: [],
      communities: [],
      events: [],
      hackathons: [],
      companies: [],
      counts: {} as Record<string, number>,
    };
  }

  const whereName = { contains: query, mode: "insensitive" as const };

  const [
    developers,
    posts,
    projects,
    jobs,
    communities,
    events,
    hackathons,
    companies,
    dCount,
    pCount,
    prCount,
    jCount,
    cCount,
    eCount,
    hCount,
    coCount,
  ] = await Promise.all([
    prisma.profile.findMany({
      where: {
        onboardingCompleted: true,
        OR: [{ fullName: whereName }, { username: whereName }, { headline: whereName }],
      },
      take,
      include: { role: true, skills: { include: { skill: true }, take: 3 } },
    }),
    prisma.post.findMany({
      where: { OR: [{ content: whereName }, { code: whereName }] },
      take,
      include: { author: true },
    }),
    prisma.project.findMany({
      where: {
        visibility: "PUBLIC",
        OR: [{ name: whereName }, { shortDescription: whereName }],
      },
      take,
      include: { technologies: { include: { skill: true } } },
    }),
    prisma.job.findMany({
      where: { status: "PUBLISHED", OR: [{ title: whereName }, { description: whereName }] },
      take,
    }),
    prisma.community.findMany({
      where: { OR: [{ nameAr: whereName }, { nameEn: whereName }] },
      take,
    }),
    prisma.event.findMany({
      where: { OR: [{ title: whereName }, { description: whereName }] },
      take,
    }),
    prisma.hackathon.findMany({
      where: { OR: [{ title: whereName }, { description: whereName }] },
      take,
    }),
    prisma.company.findMany({
      where: { OR: [{ name: whereName }, { description: whereName }] },
      take,
    }),
    prisma.profile.count({
      where: {
        onboardingCompleted: true,
        OR: [{ fullName: whereName }, { username: whereName }, { headline: whereName }],
      },
    }),
    prisma.post.count({ where: { OR: [{ content: whereName }, { code: whereName }] } }),
    prisma.project.count({
      where: {
        visibility: "PUBLIC",
        OR: [{ name: whereName }, { shortDescription: whereName }],
      },
    }),
    prisma.job.count({
      where: { status: "PUBLISHED", OR: [{ title: whereName }, { description: whereName }] },
    }),
    prisma.community.count({
      where: { OR: [{ nameAr: whereName }, { nameEn: whereName }] },
    }),
    prisma.event.count({ where: { OR: [{ title: whereName }, { description: whereName }] } }),
    prisma.hackathon.count({
      where: { OR: [{ title: whereName }, { description: whereName }] },
    }),
    prisma.company.count({
      where: { OR: [{ name: whereName }, { description: whereName }] },
    }),
  ]);

  return {
    developers,
    posts,
    projects,
    jobs,
    communities,
    events,
    hackathons,
    companies,
    counts: {
      developers: dCount,
      posts: pCount,
      projects: prCount,
      jobs: jCount,
      communities: cCount,
      events: eCount,
      hackathons: hCount,
      companies: coCount,
    },
  };
}
