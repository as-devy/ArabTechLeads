import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  email: string | null;
  name?: string | null;
  image?: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name,
    image: session.user.image,
  };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function getCurrentProfile() {
  const user = await getSessionUser();
  if (!user) return null;

  return prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      role: true,
      roles: { include: { role: true } },
      country: true,
      skills: { include: { skill: true } },
      interests: { include: { interest: true } },
    },
  });
}

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("UNAUTHORIZED");
  }
  if (profile.suspendedAt) {
    throw new Error("SUSPENDED");
  }
  return profile;
}

export async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) {
    throw new Error("FORBIDDEN");
  }
  return profile;
}
