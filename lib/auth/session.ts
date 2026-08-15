import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getSessionUser() {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
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
  return profile;
}
