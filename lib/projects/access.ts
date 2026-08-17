import { prisma } from "@/lib/prisma";

export async function getProjectBySlug(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    include: {
      owner: { include: { role: true } },
      members: { include: { profile: { include: { role: true, skills: { include: { skill: true }, take: 4 } } } } },
      roles: true,
      technologies: { include: { skill: true } },
      _count: { select: { members: true, tasks: true, discussions: true } },
    },
  });
}

export async function canViewProject(
  project: { visibility: string; ownerId: string; id: string },
  userId?: string | null,
) {
  if (project.visibility === "PUBLIC") return true;
  if (!userId) return false;
  if (project.ownerId === userId) return true;
  const member = await prisma.projectMember.findUnique({
    where: { projectId_profileId: { projectId: project.id, profileId: userId } },
  });
  return Boolean(member);
}

export async function getMembership(projectId: string, userId: string) {
  return prisma.projectMember.findUnique({
    where: { projectId_profileId: { projectId, profileId: userId } },
  });
}

export function isOwnerOrMaintainer(roleName?: string | null) {
  return roleName === "owner" || roleName === "maintainer";
}
