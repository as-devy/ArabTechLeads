"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  onboardingBasicsSchema,
  onboardingBioSchema,
  onboardingCountrySchema,
  onboardingInterestsSchema,
  onboardingRoleSchema,
  onboardingSkillsSchema,
} from "@/lib/validations/auth";

export type OnboardingActionState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
};

export async function saveOnboardingBasics(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const user = await requireUser();
  const parsed = onboardingBasicsSchema.safeParse({
    fullName: formData.get("fullName"),
    username: formData.get("username"),
    avatarUrl: formData.get("avatarUrl") || "",
  });

  if (!parsed.success) {
    return {
      error: "VALIDATION_ERROR",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const username = parsed.data.username.toLowerCase();
  const existing = await prisma.profile.findFirst({
    where: {
      username,
      NOT: { id: user.id },
    },
    select: { id: true },
  });

  if (existing) {
    return { error: "USERNAME_TAKEN" };
  }

  await prisma.profile.upsert({
    where: { id: user.id },
    update: {
      fullName: parsed.data.fullName,
      username,
      avatarUrl: parsed.data.avatarUrl || null,
      email: user.email ?? "",
    },
    create: {
      id: user.id,
      email: user.email ?? "",
      fullName: parsed.data.fullName,
      username,
      avatarUrl: parsed.data.avatarUrl || null,
    },
  });

  return { success: true };
}

export async function saveOnboardingBio(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const user = await requireUser();
  const parsed = onboardingBioSchema.safeParse({
    bio: formData.get("bio") || "",
  });

  if (!parsed.success) {
    return {
      error: "VALIDATION_ERROR",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.profile.update({
    where: { id: user.id },
    data: { bio: parsed.data.bio || null },
  });

  return { success: true };
}

export async function saveOnboardingRole(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const user = await requireUser();
  const parsed = onboardingRoleSchema.safeParse({
    roleId: formData.get("roleId"),
  });

  if (!parsed.success) {
    return { error: "VALIDATION_ERROR" };
  }

  await prisma.profile.update({
    where: { id: user.id },
    data: { roleId: parsed.data.roleId },
  });

  return { success: true };
}

export async function saveOnboardingSkills(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const user = await requireUser();
  const skillIds = formData.getAll("skillIds").map(String);
  const parsed = onboardingSkillsSchema.safeParse({ skillIds });

  if (!parsed.success) {
    return { error: "SELECT_SKILLS" };
  }

  await prisma.$transaction([
    prisma.profileSkill.deleteMany({ where: { profileId: user.id } }),
    prisma.profileSkill.createMany({
      data: parsed.data.skillIds.map((skillId) => ({
        profileId: user.id,
        skillId,
      })),
      skipDuplicates: true,
    }),
  ]);

  return { success: true };
}

export async function saveOnboardingInterests(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const user = await requireUser();
  const interestIds = formData.getAll("interestIds").map(String);
  const parsed = onboardingInterestsSchema.safeParse({ interestIds });

  if (!parsed.success) {
    return { error: "SELECT_INTERESTS" };
  }

  await prisma.$transaction([
    prisma.profileInterest.deleteMany({ where: { profileId: user.id } }),
    prisma.profileInterest.createMany({
      data: parsed.data.interestIds.map((interestId) => ({
        profileId: user.id,
        interestId,
      })),
      skipDuplicates: true,
    }),
  ]);

  return { success: true };
}

export async function saveOnboardingCountry(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const user = await requireUser();
  const parsed = onboardingCountrySchema.safeParse({
    countryCode: formData.get("countryCode") || "",
  });

  if (!parsed.success) {
    return { error: "VALIDATION_ERROR" };
  }

  await prisma.profile.update({
    where: { id: user.id },
    data: {
      countryCode: parsed.data.countryCode || null,
    },
  });

  return { success: true };
}

export async function completeOnboardingAction(): Promise<OnboardingActionState> {
  const user = await requireUser();

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      skills: true,
      interests: true,
    },
  });

  if (
    !profile?.fullName ||
    !profile.username ||
    !profile.roleId ||
    profile.skills.length === 0 ||
    profile.interests.length === 0
  ) {
    return { error: "ONBOARDING_INCOMPLETE" };
  }

  await prisma.profile.update({
    where: { id: user.id },
    data: { onboardingCompleted: true },
  });

  revalidatePath("/app");
  redirect("/app");
}
