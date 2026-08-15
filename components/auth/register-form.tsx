"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  registerAction,
  signInWithGoogleAction,
  type AuthActionState,
} from "@/lib/actions/auth";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AuthActionState = {};

export function RegisterForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

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
          {useTranslations("common").has("or") ? useTranslations("common")("or") : "or"}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-5">
        <div className="space-y-3.5">
        <Input
            name="username"
            type="text"
            autoComplete="username"
            required
            label={t("username")}
            placeholder="John Doe"
            dir="ltr"
            className="text-start"
          />
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
            autoComplete="new-password"
            required
            label={t("password")}
            placeholder="••••••••"
            hint={t("passwordHint")}
          />
          <PasswordInput
            name="confirmPassword"
            autoComplete="new-password"
            required
            label={t("confirmPassword")}
            placeholder="••••••••"
          />
        </div>

        {state.error ? (
          <p
            className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
            role="alert"
          >
            {t(`errors.${state.error}` as never)}
          </p>
        ) : null}

        {state.success === "CHECK_EMAIL" ? (
          <p
            className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
            role="status"
          >
            {t("checkEmail")}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? t("loading") : t("registerSubmit")}
        </Button>

        <div className="border-t border-border/70 pt-4">
          <p className="text-center text-sm text-secondary">
            {t("hasAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-accent hover:text-accent-hover"
            >
              {t("loginSubmit")}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
