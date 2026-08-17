import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(72),
});

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "USERNAME_TOO_SHORT")
  .max(24, "USERNAME_TOO_LONG")
  .regex(/^[a-zA-Z0-9_]+$/, "INVALID_USERNAME")
  .transform((value) => value.toLowerCase());

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "PASSWORDS_DO_NOT_MATCH",
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const onboardingBasicsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "FULL_NAME_TOO_SHORT")
    .max(80, "FULL_NAME_TOO_LONG"),
  username: usernameSchema,
  avatarUrl: z
    .union([z.literal(""), z.string().trim().url("INVALID_AVATAR_URL")])
    .optional(),
});

export const onboardingBioSchema = z.object({
  bio: z.string().trim().max(500).optional().or(z.literal("")),
});

export const onboardingRoleSchema = z.object({
  roleIds: z.array(z.string().min(1)).min(1, "SELECT_ROLES").max(8),
});

export const onboardingSkillsSchema = z.object({
  skillIds: z.array(z.string().uuid()).min(1).max(20),
});

export const onboardingInterestsSchema = z.object({
  interestIds: z.array(z.string().uuid()).min(1).max(12),
});

export const onboardingCountrySchema = z.object({
  countryCode: z.string().length(2).optional().or(z.literal("")),
});
