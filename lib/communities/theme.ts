import type { CSSProperties } from "react";

export const COMMUNITY_PALETTE = [
  "#0284c7",
  "#0ea5e9",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#64748b",
  "#111827",
] as const;

export const COMMUNITY_THEMES: Record<string, string> = {
  react: "#38bdf8",
  nextjs: "#111827",
  backend: "#6366f1",
  cybersecurity: "#e11d48",
  "ai-ml": "#a855f7",
  devops: "#06b6d4",
  uiux: "#f97316",
  "open-source": "#16a34a",
  flutter: "#027dfd",
  python: "#eab308",
};

export function normalizeHex(value: string | null | undefined, fallback = "#0284c7") {
  const hex = (value ?? "").trim();
  return /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex.toLowerCase() : fallback;
}

export function resolveThemeColor(slug: string, stored?: string | null) {
  if (COMMUNITY_THEMES[slug]) return COMMUNITY_THEMES[slug];
  const hex = (stored ?? "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex.toLowerCase();
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COMMUNITY_PALETTE[hash % COMMUNITY_PALETTE.length];
}

export function communitySurfaceStyle(color: string): CSSProperties {
  const theme = normalizeHex(color);
  return {
    "--community": theme,
    "--community-muted": `color-mix(in oklab, ${theme} 16%, transparent)`,
    "--community-soft": `color-mix(in oklab, ${theme} 9%, var(--surface))`,
    borderInlineStartColor: theme,
  } as CSSProperties;
}
