import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  SectionHeader,
  SectionPanel,
  SectionShell,
} from "@/components/marketing/section-frame";

export async function CodeShareSection() {
  const t = await getTranslations("codeShare");

  return (
    <SectionShell>
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <SectionHeader
          align="start"
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <SectionPanel className="fade-up">
          <div className="flex items-center gap-3 border-b border-border/70 px-5 py-4">
            <div className="flex size-11 items-center justify-center rounded-lg border border-accent/25 bg-[radial-gradient(circle_at_30%_25%,color-mix(in_oklab,var(--accent)_20%,transparent),transparent_65%)] text-xs font-semibold text-accent">
              SA
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                {t("author")}
              </p>
              <p className="truncate text-xs text-muted">
                <span className="dir-ltr inline-block">{t("role")}</span>
                {" · "}
                <span className="dir-ltr inline-block">{t("lang")}</span>
              </p>
            </div>
            <span className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
              01
            </span>
          </div>

          <div className="space-y-4 px-5 py-5">
            <p className="text-sm leading-7 text-foreground">{t("question")}</p>

            <pre
              className="dir-ltr overflow-x-auto rounded-lg border border-code-border bg-code-bg p-4 text-start font-mono text-[12px] leading-6 text-secondary"
              tabIndex={0}
            >
              <code>
                <span className="text-accent">async</span>
                {" function "}
                <span className="text-foreground">getDevelopers</span>
                {"(skill: "}
                <span className="text-accent">string</span>
                {") {\n"}
                {"  "}
                <span className="text-accent">const</span>
                {" { data } = "}
                <span className="text-accent">await</span>
                {" supabase\n"}
                {'    .from("profiles")\n'}
                {'    .select("username, role, skills")\n'}
                {"    .contains("}
                <span className="text-[#a78bfa]">&quot;skills&quot;</span>
                {", [skill])\n"}
                {"    .limit(12);\n\n"}
                {"  "}
                <span className="text-accent">return</span>
                {" data ?? [];\n"}
                {"}"}
              </code>
            </pre>

            <div className="flex flex-wrap gap-1.5">
              {["TypeScript", "Supabase", "Next.js"].map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-border/80 px-2 py-0.5 text-[11px] text-muted"
                >
                  <span className="dir-ltr inline-block">{tag}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 border-t border-border/70 px-2 py-2 text-xs text-muted">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 transition-colors hover:bg-accent-muted hover:text-foreground"
            >
              <Heart className="size-3.5" />
              {t("like")}
              <span className="dir-ltr text-secondary">24</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 transition-colors hover:bg-accent-muted hover:text-foreground"
            >
              <MessageCircle className="size-3.5" />
              {t("comment")}
              <span className="dir-ltr text-secondary">8</span>
            </button>
            <button
              type="button"
              className="ms-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 transition-colors hover:bg-accent-muted hover:text-foreground"
            >
              <Bookmark className="size-3.5" />
              {t("save")}
            </button>
          </div>
        </SectionPanel>
      </div>
    </SectionShell>
  );
}
