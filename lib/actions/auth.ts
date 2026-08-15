"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

function mapAuthError(error: unknown): string {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
      ? (error as { message: string }).message.toLowerCase()
      : "";

  if (message.includes("invalid login")) return "INVALID_CREDENTIALS";
  if (message.includes("already registered")) return "EMAIL_TAKEN";
  if (message.includes("rate limit")) return "RATE_LIMITED";
  return "UNKNOWN_ERROR";
}

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
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
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) throw error;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "INVALID_CREDENTIALS" };
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { onboardingCompleted: true },
    });

    redirect(profile?.onboardingCompleted ? "/app" : "/onboarding");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { error: mapAuthError(error) };
  }
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    if (parsed.error.issues.some((i) => i.message === "PASSWORDS_DO_NOT_MATCH")) {
      return { error: "PASSWORDS_DO_NOT_MATCH", fieldErrors };
    }
    return { error: "VALIDATION_ERROR", fieldErrors };
  }

  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) throw error;

    if (data.user && !data.session) {
      return { success: "CHECK_EMAIL" };
    }

    if (data.user) {
      await prisma.profile.upsert({
        where: { id: data.user.id },
        update: { email: parsed.data.email },
        create: {
          id: data.user.id,
          email: parsed.data.email,
        },
      });
    }

    redirect("/onboarding");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { error: mapAuthError(error) };
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

  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${siteUrl}/auth/callback?next=/app/settings`,
    });

    if (error) throw error;
    return { success: "RESET_SENT" };
  } catch (error) {
    return { error: mapAuthError(error) };
  }
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function signInWithGoogleAction() {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    redirect(`/login?error=oauth`);
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect(`/login?error=oauth`);
}
