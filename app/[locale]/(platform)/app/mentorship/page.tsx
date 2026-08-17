import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string }> };

export default async function MentorshipPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");
  const mentors = await prisma.mentorProfile.findMany({
    where: { isActive: true },
    include: { profile: { include: { role: true } } },
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-semibold">{t("mentors")}</h1>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {mentors.length === 0 ? <p className="text-sm text-secondary">{t("emptyMentors")}</p> : mentors.map((m) => (
          <li key={m.profileId} className="rounded-xl border border-border p-4">
            <Link href={`/app/mentorship/${m.profile.username}` as never} className="flex gap-3">
              <Avatar name={m.profile.fullName} src={m.profile.avatarUrl} />
              <span>
                <span className="block font-medium">{m.profile.fullName}</span>
                <span className="block text-xs text-muted">{m.topics.join(" · ")}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
