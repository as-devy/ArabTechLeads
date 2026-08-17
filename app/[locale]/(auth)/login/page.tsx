import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  const oauthFailed = Boolean(
    error &&
      ["oauth", "Configuration", "AccessDenied", "OAuthCallback", "OAuthAccountNotLinked", "Callback"].includes(
        error,
      ),
  );

  return (
    <AuthShell title={t("loginTitle")} subtitle={t("loginSubtitle")}>
      {oauthFailed ? (
        <p
          className="mb-4 rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
          role="alert"
        >
          {t("errors.OAUTH_ERROR")}
        </p>
      ) : null}
      <LoginForm />
    </AuthShell>
  );
}
