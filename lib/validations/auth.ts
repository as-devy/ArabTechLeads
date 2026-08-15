import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "PASSWORDS_DO_NOT_MATCH",
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const onboardingBasicsSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  username: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "INVALID_USERNAME"),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const onboardingBioSchema = z.object({
  bio: z.string().trim().max(500).optional().or(z.literal("")),
});

export const onboardingRoleSchema = z.object({
  roleId: z.string().min(1),
});

export const onboardingSkillsSchema = z.object({
  skillIds: z.array(z.string().uuid()).min(1).max(20),
});

export const onboardingInterestsSchema = z.object({
  interestIds: z.array(z.string().uuid()).min(1).max(12),
});

export const onboardingCountrySchema = z.object({
  countryCode: z
    .string()
    .length(2)
    .optional()
    .or(z.literal("")),
});
