import { prisma } from "@/lib/prisma";

export type CollaboratorMatch = {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  score: number;
  sharedSkills: string[];
  reason: string;
};

export async function matchCollaborators(options: {
  viewerId: string;
  requiredSkills: string[];
  requiredRole?: string | null;
  take?: number;
}): Promise<CollaboratorMatch[]> {
  const { viewerId, requiredSkills, take = 6 } = options;
  const skillNames = requiredSkills.map((s) => s.toLowerCase());

  const developers = await prisma.profile.findMany({
    where: { id: { not: viewerId }, onboardingCompleted: true },
    take: 80,
    include: {
      role: true,
      skills: { include: { skill: true } },
    },
  });

  return developers
    .map((dev) => {
      const names = dev.skills.map((s) => s.skill.name);
      const shared = names.filter((n) => skillNames.includes(n.toLowerCase()));
      let score = shared.length * 30;
      if (
        options.requiredRole &&
        (dev.role?.nameEn === options.requiredRole ||
          dev.role?.nameAr === options.requiredRole)
      ) {
        score += 40;
      }
      return {
        id: dev.id,
        username: dev.username,
        fullName: dev.fullName,
        avatarUrl: dev.avatarUrl,
        score,
        sharedSkills: shared,
        reason:
          shared.length > 0
            ? `${shared.length} shared skills`
            : "Possible collaborator",
      };
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, take);
}
