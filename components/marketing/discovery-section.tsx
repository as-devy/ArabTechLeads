"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  SectionHeader,
  SectionPanel,
  SectionShell,
} from "@/components/marketing/section-frame";
import { cn } from "@/lib/utils";

const tags = [
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "TypeScript",
  "Flutter",
  "Laravel",
  "Django",
  "Docker",
  "AWS",
  "Cybersecurity",
  "AI",
];

const people = [
  {
    name: "Omar H.",
    role: "Full Stack",
    skills: ["React", "Next.js", "TypeScript", "Node.js"],
  },
  {
    name: "Lina K.",
    role: "Backend",
    skills: ["Python", "Django", "Docker", "AWS"],
  },
  {
    name: "Youssef M.",
    role: "Mobile",
    skills: ["Flutter", "Dart", "Firebase"],
  },
  {
    name: "Nour A.",
    role: "Security",
    skills: ["Cybersecurity", "Python", "Linux"],
  },
  {
    name: "Rami S.",
    role: "AI Engineer",
    skills: ["AI", "Python", "TypeScript"],
  },
  {
    name: "Hiba T.",
    role: "Frontend",
    skills: ["React", "TypeScript", "Next.js"],
  },
];

export function DiscoverySection() {
  const t = useTranslations("discovery");
  const [active, setActive] = useState("React");

  const matched = useMemo(
    () => people.filter((p) => p.skills.includes(active)),
    [active],
  );

  return (
    <SectionShell id="developers" muted>
      <SectionHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <SectionPanel className="mt-14">
        <div className="border-b border-border/70 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActive(tag)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  active === tag
                    ? "border-accent/50 bg-accent-muted text-foreground"
                    : "border-border/80 bg-background/50 text-secondary hover:border-accent/30 hover:text-foreground",
                )}
              >
                <span className="dir-ltr inline-block">{tag}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3">
          {matched.map((person, i) => (
            <article
              key={person.name}
              className={cn(
                "group relative p-5 sm:p-6 fade-up",
                "transition-colors duration-300 hover:bg-accent-muted/35",
                "border-b border-border/70 sm:border-e",
                "lg:[&:nth-child(3n)]:border-e-0",
                "sm:[&:nth-child(2n)]:border-e-0 lg:[&:nth-child(2n)]:border-e",
              )}
              style={{ animationDelay: `${100 + i * 80}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-[radial-gradient(circle_at_30%_25%,color-mix(in_oklab,var(--accent)_20%,transparent),transparent_65%)] text-sm font-semibold text-accent">
                  {person.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold tracking-tight text-foreground">
                    {person.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted">{person.role}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {person.skills.map((skill) => (
                  <span
                    key={skill}
                    className={cn(
                      "rounded border px-2 py-0.5 text-[11px]",
                      skill === active
                        ? "border-accent/40 bg-accent-muted text-foreground"
                        : "border-border text-muted",
                    )}
                  >
                    <span className="dir-ltr inline-block">{skill}</span>
                  </span>
                ))}
              </div>
              <div className="mt-5 h-px w-8 bg-accent/35 transition-all duration-300 group-hover:w-12 group-hover:bg-accent" />
            </article>
          ))}
          {matched.length === 0 ? (
            <p className="col-span-full px-6 py-12 text-center text-sm text-muted">
              {t("empty")}
            </p>
          ) : null}
        </div>
      </SectionPanel>
    </SectionShell>
  );
}
