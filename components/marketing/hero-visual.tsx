"use client";

import { BrandMark } from "@/components/brand/brand-mark";

const nodes = [
  { id: "a", x: 18, y: 28, label: "React", size: 42 },
  { id: "b", x: 42, y: 18, label: "Next.js", size: 48 },
  { id: "c", x: 68, y: 26, label: "TypeScript", size: 44 },
  { id: "d", x: 82, y: 52, label: "Node.js", size: 40 },
  { id: "e", x: 58, y: 62, label: "AI", size: 46 },
  { id: "f", x: 28, y: 58, label: "DevOps", size: 42 },
  { id: "g", x: 48, y: 42, label: "ATL", size: 56 },
];

const edges: Array<[string, string]> = [
  ["g", "a"],
  ["g", "b"],
  ["g", "c"],
  ["g", "d"],
  ["g", "e"],
  ["g", "f"],
  ["a", "b"],
  ["c", "d"],
  ["e", "f"],
];

function getNode(id: string) {
  return nodes.find((n) => n.id === id)!;
}

export function HeroVisual() {
  return (
    <div
      className="relative mx-auto aspect-[4/3] w-full max-w-xl fade-in"
      style={{ animationDelay: "180ms" }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 overflow-hidden rounded-xl border border-border bg-surface-elevated/70 shadow-md surface-grid">
        <div className="absolute inset-0 hero-glow opacity-80" />

        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {edges.map(([from, to]) => {
            const a = getNode(from);
            const b = getNode(to);
            return (
              <line
                key={`${from}-${to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--accent)"
                strokeOpacity="0.35"
                strokeWidth="0.35"
                className="connection-line"
              />
            );
          })}
        </svg>

        {nodes.map((node, index) =>
          node.id === "g" ? (
            <div
              key={node.id}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 float-soft"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                animationDelay: `${index * 120}ms`,
              }}
            >
              <div className="relative">
                <BrandMark size={56} />
                <span className="pointer-events-none absolute inset-0 rounded-full bg-accent/15 pulse-soft" />
              </div>
            </div>
          ) : (
            <div
              key={node.id}
              className={cnFloat(false)}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                width: node.size,
                height: node.size,
                animationDelay: `${index * 120}ms`,
              }}
            >
              <span className="relative z-10 text-[10px] font-medium tracking-tight text-foreground sm:text-[11px]">
                {node.label}
              </span>
            </div>
          ),
        )}

        <div className="absolute inset-x-4 bottom-4 rounded-lg border border-border bg-background/80 p-3 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium tracking-[-0.02em] text-foreground">
                Arab
                <span className="text-muted">Tech</span>
                <span className="text-accent">Leads</span>
                <span className="ms-1.5 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                  Network
                </span>
              </p>
              <p className="truncate text-[11px] text-muted">
                skills → communities → connections
              </p>
            </div>
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {["SA", "YM", "NK", "AR"].map((initials) => (
                <span
                  key={initials}
                  className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-surface text-[10px] font-semibold text-secondary"
                >
                  {initials}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cnFloat(isCenter: boolean) {
  return [
    "absolute -translate-x-1/2 -translate-y-1/2",
    "inline-flex items-center justify-center rounded-full border border-border",
    "bg-surface/90 text-center shadow-sm backdrop-blur-sm",
    isCenter ? "border-accent/50 bg-accent-muted float-soft" : "float-soft",
  ].join(" ");
}
