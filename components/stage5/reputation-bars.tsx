import { getTranslations } from "next-intl/server";

const keys = {
  TECHNICAL: "repTechnical",
  COMMUNITY: "repCommunity",
  PROJECT: "repProject",
  COLLABORATION: "repCollab",
  MENTORSHIP: "repMentorship",
  OPEN_SOURCE: "repOss",
} as const;

export async function ReputationBars({
  rows,
}: {
  rows: { category: keyof typeof keys; score: number }[];
}) {
  const t = await getTranslations("app.stage5");
  return (
    <section className="rounded-xl border border-border p-4">
      <h2 className="text-sm font-semibold">{t("reputation")}</h2>
      <p className="mt-1 text-xs text-muted">{t("reputationHint")}</p>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.category}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{t(keys[row.category])}</span>
              <span className="dir-ltr">{row.score}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-elevated">
              <div
                className="h-full bg-accent"
                style={{ width: `${row.score}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
