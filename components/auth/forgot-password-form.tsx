"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  forgotPasswordAction,
  type AuthActionState,
} from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AuthActionState = {};

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
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

      {state.error ? (
        <p
          className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
          role="alert"
        >
          {t(`errors.${state.error}` as never)}
        </p>
      ) : null}

      {state.success === "RESET_SENT" ? (
        <p
          className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
          role="status"
        >
          {t("resetSent")}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? t("loading") : t("resetSubmit")}
      </Button>

      <div className="border-t border-border/70 pt-4">
        <p className="text-center text-sm text-secondary">
          <Link
            href="/login"
            className="font-medium text-accent hover:text-accent-hover"
          >
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    </form>
  );
}
