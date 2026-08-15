"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  loginAction,
  signInWithGoogleAction,
  type AuthActionState,
} from "@/lib/actions/auth";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AuthActionState = {};

export function LoginForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  const errorMessage = state.error
    ? t.has(`errors.${state.error}` as never)
      ? t(`errors.${state.error}` as never)
      : t("errors.UNKNOWN_ERROR")
    : null;

  return (
    <div className="space-y-5">
      <GoogleAuthButton
        label={
          t.has("continueWithGoogle")
            ? t("continueWithGoogle")
            : "Continue with Google"
        }
        pendingLabel={t("loading")}
        action={signInWithGoogleAction}
      />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted">
          {t.has("orEmail") ? t("orEmail") : "or"}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-5">
        <div className="space-y-3.5">
          <Input
            name="email"
            type="email"
            autoComplete="email"
            required
            label={t("email")}
            placeholder="name@example.com"
            dir="ltr"
            className="text-start"
          />
          <PasswordInput
            name="password"
            autoComplete="current-password"
            required
            label={t("password")}
            placeholder="••••••••"
          />
        </div>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-secondary transition-colors hover:text-accent"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        {errorMessage ? (
          <p
            className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? t("loading") : t("loginSubmit")}
        </Button>

        <div className="border-t border-border/70 pt-4">
          <p className="text-center text-sm text-secondary">
            {t("noAccount")}{" "}
            <Link
              href="/register"
              className="font-medium text-accent hover:text-accent-hover"
            >
              {t("createAccount")}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
