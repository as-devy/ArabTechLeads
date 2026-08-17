import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { getCurrentProfile } from "@/lib/auth/session";
import { requestMentorshipAction } from "@/lib/actions/opportunities";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string; username: string }> };

export default async function MentorPage({ params }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");
  const profile = await prisma.profile.findFirst({
    where: { username },
    include: { mentorProfile: true, role: true, skills: { include: { skill: true } } },
  });
  if (!profile?.mentorProfile?.isActive) notFound();
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Avatar name={profile.fullName} src={profile.avatarUrl} size="lg" />
      <h1 className="mt-3 text-2xl font-semibold">{profile.fullName}</h1>
      <p className="text-sm text-secondary">{locale === "ar" ? profile.role?.nameAr : profile.role?.nameEn}</p>
      <p className="mt-3 text-sm">{profile.mentorProfile.bio}</p>
      <p className="mt-2 text-xs text-muted">{profile.mentorProfile.topics.join(" · ")}</p>
      {me.id !== profile.id ? (
        <form action={requestMentorshipAction.bind(null, profile.id)} className="mt-6 space-y-2">
          <input name="topic" required placeholder="Topic" className="h-10 w-full rounded-md border border-border px-3 text-sm" />
          <textarea name="message" rows={4} className="w-full rounded-md border border-border p-3 text-sm" />
          <Button type="submit">{t("requestMentor")}</Button>
        </form>
      ) : null}
    </div>
  );
}
