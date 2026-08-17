import { prisma } from "@/lib/prisma";

function delegate(name: "userBlock" | "userMute") {
  return Reflect.get(prisma, name, prisma) as
    | {
        findFirst: (args: unknown) => Promise<{ entityId?: string } | null>;
        findMany: (args: unknown) => Promise<Array<{ entityId: string }>>;
      }
    | undefined;
}

export async function isBlockedPair(a: string, b: string) {
  const userBlock = delegate("userBlock");
  if (!userBlock?.findFirst) return false;
  try {
    const row = await userBlock.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
    });
    return Boolean(row);
  } catch {
    return false;
  }
}

export async function mutedIds(profileId: string, entityType: string) {
  const userMute = delegate("userMute");
  if (!userMute?.findMany) return [];
  try {
    const rows = await userMute.findMany({
      where: { profileId, entityType },
      select: { entityId: true },
    });
    return rows.map((r: { entityId: string }) => r.entityId);
  } catch {
    return [];
  }
}
