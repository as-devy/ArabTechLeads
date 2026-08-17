import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { ProjectCreateWizard } from "@/components/projects/project-create-wizard";
import { getCurrentProfile } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function CreateProjectPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  return (
    <div className="px-4 py-8 lg:px-6">
      <ProjectCreateWizard />
    </div>
  );
}
