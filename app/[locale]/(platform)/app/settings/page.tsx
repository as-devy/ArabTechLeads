import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { getCurrentProfile } from "@/lib/auth/session";
import { updateCareerSettingsAction } from "@/lib/actions/opportunities";
import { updateProfileSettingsAction } from "@/lib/actions/social";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.settings");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <form action={updateProfileSettingsAction} className="mt-6 space-y-4">
        <section className="rounded-xl border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold">{t("profile")}</h2>
          <label className="block text-xs text-muted">{t("profile")}</label>
          <input
            name="fullName"
            defaultValue={me.fullName ?? ""}
            className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
          <textarea
            name="bio"
            defaultValue={me.bio ?? ""}
            rows={4}
            className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            name="avatarUrl"
            defaultValue={me.avatarUrl ?? ""}
            placeholder="Avatar URL"
            className="mt-3 h-10 w-full rounded-md border border-border bg-background px-3 text-sm dir-ltr"
          />
          <input
            name="githubUrl"
            defaultValue={me.githubUrl ?? ""}
            placeholder="GitHub"
            className="mt-3 h-10 w-full rounded-md border border-border bg-background px-3 text-sm dir-ltr"
          />
          <input
            name="linkedinUrl"
            defaultValue={me.linkedinUrl ?? ""}
            placeholder="LinkedIn"
            className="mt-3 h-10 w-full rounded-md border border-border bg-background px-3 text-sm dir-ltr"
          />
          <input
            name="portfolioUrl"
            defaultValue={me.portfolioUrl ?? ""}
            placeholder="Portfolio"
            className="mt-3 h-10 w-full rounded-md border border-border bg-background px-3 text-sm dir-ltr"
          />
        </section>
        <section className="rounded-xl border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold">{t("appearance")}</h2>
          <ThemeToggle />
          <select name="theme" defaultValue={me.theme} className="mt-3 h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </section>
        <section className="rounded-xl border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold">{t("language")}</h2>
          <LanguageSwitcher />
          <select name="locale" defaultValue={me.locale} className="mt-3 h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </section>
        <Button type="submit">{t("save")}</Button>
      </form>
      <form action={updateCareerSettingsAction} className="mt-6 space-y-3 rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold">Career</h2>
        <input name="headline" defaultValue={me.headline ?? ""} placeholder="Headline" className="h-10 w-full rounded-md border border-border px-3 text-sm" />
        <input name="resumeUrl" defaultValue={me.resumeUrl ?? ""} placeholder="Resume URL" className="h-10 w-full rounded-md border border-border px-3 text-sm dir-ltr" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="openToWork" defaultChecked={me.openToWork} /> Open to work</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="openToFreelance" defaultChecked={me.openToFreelance} /> Freelance</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="openToMentorship" defaultChecked={me.openToMentorship} /> Mentorship</label>
        <textarea name="mentorBio" rows={3} placeholder="Mentor bio" className="w-full rounded-md border border-border p-3 text-sm" />
        <Button type="submit">{t("save")}</Button>
      </form>
    </div>
  );
}
