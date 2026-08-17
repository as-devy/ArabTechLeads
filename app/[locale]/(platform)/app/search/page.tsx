import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { unifiedSearch } from "@/lib/search/unified";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q = "" } = await searchParams;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.stage5");
  const result = await unifiedSearch(q);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <h1 className="text-2xl font-semibold">{t("searchTitle")}</h1>
      <form className="mt-4">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
          className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm"
        />
      </form>
      {!q ? (
        <p className="mt-8 text-sm text-secondary">{t("searchEmptyQuery")}</p>
      ) : (
        <div className="mt-8 space-y-8">
          <Group title={t("developers")} count={result.counts.developers}>
            {result.developers.map((d) => (
              <Link key={d.id} href={`/app/developers/${d.username}` as never} className="block rounded-lg border border-border p-3 text-sm">
                {d.fullName}
              </Link>
            ))}
          </Group>
          <Group title={t("projects")} count={result.counts.projects}>
            {result.projects.map((p) => (
              <Link key={p.id} href={`/app/projects/${p.slug}` as never} className="block rounded-lg border border-border p-3 text-sm">
                {p.name}
                {p.projectType === "OPEN_SOURCE" ? ` · ${t("openSource")}` : ""}
              </Link>
            ))}
          </Group>
          <Group title={t("jobs")} count={result.counts.jobs}>
            {result.jobs.map((j) => (
              <Link key={j.id} href={`/app/jobs/${j.slug}` as never} className="block rounded-lg border border-border p-3 text-sm">
                {j.title}
              </Link>
            ))}
          </Group>
          <Group title={t("communities")} count={result.counts.communities}>
            {result.communities.map((c) => (
              <Link key={c.id} href={`/app/communities/${c.slug}` as never} className="block rounded-lg border border-border p-3 text-sm">
                {locale === "ar" ? c.nameAr : c.nameEn}
              </Link>
            ))}
          </Group>
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold">
        {title} <span className="text-muted dir-ltr">({count})</span>
      </h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
