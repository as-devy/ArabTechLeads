import { prisma } from "@/lib/prisma";

export function scoreSkillOverlap(have: string[], need: string[]) {
  const set = new Set(have.map((s) => s.toLowerCase()));
  const matched = need.filter((s) => set.has(s.toLowerCase()));
  const score = need.length ? Math.round((matched.length / need.length) * 100) : 0;
  return {
    score,
    matchedSkills: matched,
    reasons: matched.length
      ? [`${matched.length} matching skills`]
      : ["Limited skill overlap"],
  };
}

export async function matchJobsForProfile(profileId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { skills: { include: { skill: true } } },
  });
  if (!profile) return [];
  const have = profile.skills.map((s) => s.skill.name);
  const jobs = await prisma.job.findMany({
    where: { status: "PUBLISHED" },
    take: 20,
    include: { company: true, skills: { include: { skill: true } } },
  });
  return jobs
    .map((job) => {
      const need = job.skills.map((s) => s.skill.name);
      const match = scoreSkillOverlap(have, need.length ? need : have.slice(0, 1));
      let score = match.score;
      if (profile.workModePreference && profile.workModePreference === job.workMode) score += 10;
      return { job, ...match, score: Math.min(100, score) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}
