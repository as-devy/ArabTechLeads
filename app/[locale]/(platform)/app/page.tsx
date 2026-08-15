import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth";
import { getCurrentProfile, getSessionUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AppHomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) redirect("/login");

  let profile = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }

  if (profile && !profile.onboardingCompleted) {
    redirect("/onboarding");
  }

  const t = await getTranslations("app");

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-border bg-surface-elevated p-6 shadow-sm">
        <p className="text-sm text-accent">{t("badge")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {t("welcome", {
            name: profile?.fullName || profile?.username || user.email || "",
          })}
        </h1>
        <p className="mt-3 text-secondary leading-7">{t("placeholder")}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm text-secondary hover:text-foreground"
          >
            {t("backHome")}
          </Link>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              {t("signOut")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
