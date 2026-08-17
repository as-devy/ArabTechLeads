import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  adminResolveReportAction,
  adminSuspendUserAction,
  adminUnsuspendUserAction,
} from "@/lib/actions/stage5";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string }> };

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me?.isAdmin) redirect("/app");
  const t = await getTranslations("app.stage5");

  const [reports, users, audits] = await Promise.all([
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { reporter: true },
    }),
    prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, fullName: true, username: true, suspendedAt: true, email: true },
    }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { admin: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <h1 className="text-2xl font-semibold">{t("admin")}</h1>
      <section className="mt-6">
        <h2 className="text-sm font-semibold">{t("reports")}</h2>
        <ul className="mt-3 space-y-2">
          {reports.length === 0 ? <p className="text-sm text-secondary">{t("emptyReports")}</p> : null}
          {reports.map((r) => (
            <li key={r.id} className="rounded-xl border border-border p-3 text-sm">
              <p>
                {r.entityType} · {r.reason} · {r.status}
              </p>
              <p className="text-xs text-muted">{r.reporter.fullName}</p>
              {r.status === "PENDING" ? (
                <div className="mt-2 flex gap-2">
                  <form action={adminResolveReportAction.bind(null, r.id, "RESOLVED")}>
                    <Button size="sm">{t("resolve")}</Button>
                  </form>
                  <form action={adminResolveReportAction.bind(null, r.id, "DISMISSED")}>
                    <Button size="sm" variant="secondary">
                      {t("dismiss")}
                    </Button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="text-sm font-semibold">{t("users")}</h2>
        <ul className="mt-3 space-y-2">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
              <span>
                {u.fullName} <span className="dir-ltr text-muted">@{u.username}</span>
                {u.suspendedAt ? ` · ${t("suspended")}` : ""}
              </span>
              {u.suspendedAt ? (
                <form action={adminUnsuspendUserAction.bind(null, u.id)}>
                  <Button size="sm" variant="secondary">
                    {t("unsuspend")}
                  </Button>
                </form>
              ) : (
                <form action={adminSuspendUserAction.bind(null, u.id, "policy")}>
                  <Button size="sm" variant="outline">
                    {t("suspend")}
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="text-sm font-semibold">{t("audit")}</h2>
        <ul className="mt-3 space-y-1 text-xs text-muted">
          {audits.map((a) => (
            <li key={a.id}>
              {a.admin.fullName} · {a.action} · {a.target}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
