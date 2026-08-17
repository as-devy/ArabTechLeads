import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string }> };

export default async function EmployerCandidatesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const people = await prisma.profile.findMany({
    where: { openToWork: true, onboardingCompleted: true },
    take: 20,
    include: { role: true, skills: { include: { skill: true }, take: 5 } },
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Candidates</h1>
      <ul className="mt-6 space-y-2">
        {people.map((p) => (
          <li key={p.id} className="rounded-lg border border-border p-3">
            <Link href={`/app/developers/${p.username}` as never}>{p.fullName}</Link>
            <p className="text-xs text-muted dir-ltr">{p.skills.map((s) => s.skill.name).join(" · ")}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
