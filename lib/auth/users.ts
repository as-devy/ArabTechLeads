import { prisma } from "@/lib/prisma";

type GoogleProfile = {
  email: string;
  name?: string | null;
  image?: string | null;
};

export async function upsertGoogleUser(profile: GoogleProfile) {
  const existing = await prisma.user.findUnique({
    where: { email: profile.email },
    select: { id: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: profile.name ?? undefined,
        image: profile.image ?? undefined,
      },
    });
    await prisma.profile.upsert({
      where: { id: existing.id },
      update: {
        email: profile.email,
        ...(profile.name ? { fullName: profile.name } : {}),
        ...(profile.image ? { avatarUrl: profile.image } : {}),
      },
      create: {
        id: existing.id,
        email: profile.email,
        fullName: profile.name,
        avatarUrl: profile.image,
      },
    });
    return existing;
  }

  const id = crypto.randomUUID();
  await prisma.user.create({
    data: {
      id,
      email: profile.email,
      name: profile.name,
      image: profile.image,
      profile: {
        create: {
          id,
          email: profile.email,
          fullName: profile.name,
          avatarUrl: profile.image,
        },
      },
    },
  });

  return { id };
}
