"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
} from "@/lib/validations/auth";

export type AuthActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

async function redirectAfterAuth(userId: string): Promise<never> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { onboardingCompleted: true },
  });
  redirect(profile?.onboardingCompleted ? "/app" : "/onboarding");
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "VALIDATION_ERROR",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });

    if (!user) {
      return { error: "INVALID_CREDENTIALS" };
    }

    await redirectAfterAuth(user.id);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AuthError) {
      return { error: "INVALID_CREDENTIALS" };
    }
    return { error: "UNKNOWN_ERROR" };
  }

  return { error: "UNKNOWN_ERROR" };
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    if (parsed.error.issues.some((i) => i.message === "PASSWORDS_DO_NOT_MATCH")) {
      return { error: "PASSWORDS_DO_NOT_MATCH", fieldErrors };
    }
    if (parsed.error.issues.some((i) => i.message === "INVALID_USERNAME")) {
      return { error: "INVALID_USERNAME", fieldErrors };
    }
    return { error: "VALIDATION_ERROR", fieldErrors };
  }

  try {
    const emailTaken = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });
    if (emailTaken) {
      return { error: "EMAIL_TAKEN" };
    }

    const usernameTaken = await prisma.profile.findUnique({
      where: { username: parsed.data.username },
      select: { id: true },
    });
    if (usernameTaken) {
      return { error: "USERNAME_TAKEN" };
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(parsed.data.password);

    await prisma.user.create({
      data: {
        id,
        email: parsed.data.email,
        name: parsed.data.username,
        passwordHash,
        profile: {
          create: {
            email: parsed.data.email,
            username: parsed.data.username,
          },
        },
      },
    });

    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    redirect("/onboarding");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { error: "UNKNOWN_ERROR" };
  }
}

export async function forgotPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      error: "VALIDATION_ERROR",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  return { success: "RESET_SENT" };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function signInWithGoogleAction() {
  try {
    await signIn("google", { redirectTo: "/app" });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirect("/login?error=oauth");
  }
}
