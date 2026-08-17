"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  code: string;
  language?: string | null;
  className?: string;
};

export function CodeBlock({ code, language, className }: Props) {
  const t = useTranslations("app.feed");
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-code-border bg-code-bg",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-code-border px-3 py-1.5">
        <span className="dir-ltr font-mono text-[11px] uppercase tracking-wide text-muted">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted hover:text-foreground"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? t("copied") : t("copy")}
        </button>
      </div>
      <pre
        className="dir-ltr max-h-[420px] overflow-auto p-4 text-start font-mono text-[13px] leading-6 text-secondary"
        dir="ltr"
        tabIndex={0}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
