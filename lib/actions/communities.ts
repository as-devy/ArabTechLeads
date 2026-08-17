"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { slugify } from "@/lib/constants/taxonomy";
import { normalizeHex } from "@/lib/communities/theme";
import { prisma, prismaModel } from "@/lib/prisma";
import { isBlockedPair } from "@/lib/trust/moderation";

async function uniqueCommunitySlug(base: string) {
  const root = slugify(base) || `group-${Date.now().toString(36)}`;
  for (let n = 0; n < 30; n++) {
    const candidate = n === 0 ? root : `${root}-${n}`;
    const exists = await prisma.community.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function createCommunityAction(formData: FormData) {
  const me = await requireProfile();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (name.length < 3) return;

  const slug = await uniqueCommunitySlug(name);
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const isOpen = formData.get("isOpen") === "on";

  const community = await prisma.community.create({
    data: {
      slug,
      nameAr: name,
      nameEn: name,
      description: description || null,
      imageUrl: imageUrl.startsWith("https://") ? imageUrl : null,
      themeColor: normalizeHex(String(formData.get("themeColor") ?? "")),
      isOpen,
      createdById: me.id,
      members: { create: { profileId: me.id, role: "owner" } },
    },
  });

  revalidatePath("/app/communities");
  redirect(`/app/communities/${community.slug}`);
}

export async function inviteToCommunityAction(communityId: string, formData: FormData) {
  const me = await requireProfile();
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) return;
  const membership = await prisma.communityMember.findUnique({
    where: { communityId_profileId: { communityId, profileId: me.id } },
  });
  if (!membership) return;

  const username = String(formData.get("username") ?? "")
    .replace(/^@/, "")
    .trim();
  const invitee = await prisma.profile.findFirst({ where: { username } });
  if (!invitee || invitee.id === me.id) return;
  if (await isBlockedPair(me.id, invitee.id)) return;

  const already = await prisma.communityMember.findUnique({
    where: { communityId_profileId: { communityId, profileId: invitee.id } },
  });
  if (already) return;

  const invitations = prismaModel<{
    upsert: (args: unknown) => Promise<unknown>;
  }>("communityInvitation");
  if (!invitations?.upsert) return;

  await invitations.upsert({
    where: { communityId_inviteeId: { communityId, inviteeId: invitee.id } },
    update: {
      status: "PENDING",
      inviterId: me.id,
      message: String(formData.get("message") ?? "").trim() || null,
    },
    create: {
      communityId,
      inviterId: me.id,
      inviteeId: invitee.id,
      message: String(formData.get("message") ?? "").trim() || null,
    },
  });
  await prisma.notification.create({
    data: {
      recipientId: invitee.id,
      actorId: me.id,
      type: "COMMUNITY_ACTIVITY",
    },
  });
  revalidatePath(`/app/communities/${community.slug}`);
}

export async function respondCommunityInviteAction(id: string, status: "ACCEPTED" | "REJECTED") {
  const me = await requireProfile();
  const invitations = prismaModel<{
    findUnique: (args: unknown) => Promise<{
      inviteeId: string;
      status: string;
      communityId: string;
      community: { slug: string };
    } | null>;
    update: (args: unknown) => Promise<unknown>;
  }>("communityInvitation");
  if (!invitations?.findUnique) return;

  const invite = await invitations.findUnique({
    where: { id },
    include: { community: true },
  });
  if (!invite || invite.inviteeId !== me.id || invite.status !== "PENDING") return;

  await invitations.update({ where: { id }, data: { status } });
  if (status === "ACCEPTED") {
    await prisma.communityMember.upsert({
      where: { communityId_profileId: { communityId: invite.communityId, profileId: me.id } },
      update: {},
      create: { communityId: invite.communityId, profileId: me.id, role: "member" },
    });
  }
  revalidatePath("/app/communities");
  revalidatePath(`/app/communities/${invite.community.slug}`);
}
