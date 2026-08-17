import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { CreateCommunityForm } from "@/components/communities/create-community-form";
import { getCurrentProfile } from "@/lib/auth/session";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function CreateCommunityPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.communities");

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <Link href="/app/communities" className="text-sm text-muted">
        ← {t("title")}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">{t("create")}</h1>
      <p className="mt-1 text-sm text-secondary">{t("createIntro")}</p>
      <div className="mt-6">
        <CreateCommunityForm />
      </div>
    </div>
  );
}
