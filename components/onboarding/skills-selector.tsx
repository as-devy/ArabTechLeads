"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { POPULAR_SKILL_NAMES } from "@/lib/constants/taxonomy";
import { cn } from "@/lib/utils";

export type SkillOption = { id: string; name: string };

type Props = {
  skills: SkillOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};

export function SkillsSelector({ skills, selectedIds, onToggle }: Props) {
  const t = useTranslations("onboarding");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedSkills = useMemo(
    () => skills.filter((skill) => selectedSet.has(skill.id)),
    [skills, selectedSet],
  );

  const suggestions = useMemo(() => {
    const available = skills.filter((skill) => !selectedSet.has(skill.id));
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      const popular = POPULAR_SKILL_NAMES.map((name) =>
        available.find((skill) => skill.name.toLowerCase() === name.toLowerCase()),
      ).filter((skill): skill is SkillOption => Boolean(skill));

      const rest = available.filter(
        (skill) =>
          !popular.some((item) => item.id === skill.id),
      );

      return [...popular, ...rest].slice(0, 12);
    }

    return available
      .filter((skill) => skill.name.toLowerCase().includes(normalized))
      .slice(0, 12);
  }, [query, selectedSet, skills]);

  function addSkill(id: string) {
    onToggle(id);
    setQuery("");
    inputRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (suggestions[0]) addSkill(suggestions[0].id);
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {t("skillsTitle")}
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-secondary">
          {t("skillsHint")}
        </p>
        <p className="mt-3 font-mono text-xs tracking-wide text-accent">
          {t("skillsSelectedCount", { count: selectedIds.length })}
        </p>
      </div>

      {selectedSkills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <button
              key={skill.id}
              type="button"
              onClick={() => onToggle(skill.id)}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-accent/60 bg-accent-muted px-3 py-2 text-sm text-foreground transition-colors hover:border-accent",
              )}
              aria-label={skill.name}
            >
              <span className="dir-ltr" dir="ltr">
                {skill.name}
              </span>
              <X className="size-3.5 shrink-0 text-muted" strokeWidth={2} />
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <label className="relative block">
          <span className="sr-only">{t("skillsSearch")}</span>
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            strokeWidth={1.8}
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setOpen(false), 120);
            }}
            onKeyDown={onKeyDown}
            placeholder={t("skillsSearch")}
            autoComplete="off"
            className="h-11 w-full rounded-lg border border-border/80 bg-background/50 pe-3 ps-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/25"
          />
        </label>

        {open ? (
          <ul className="absolute z-20 mt-1.5 max-h-64 w-full overflow-auto rounded-lg border border-border/80 bg-surface-elevated py-1 shadow-md">
            {suggestions.length > 0 ? (
              suggestions.map((skill) => (
                <li key={skill.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => addSkill(skill.id)}
                    className="flex w-full items-center px-3 py-2.5 text-start text-sm text-foreground transition-colors hover:bg-accent-muted"
                  >
                    <span className="dir-ltr" dir="ltr">
                      {skill.name}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-6 text-center text-sm text-muted">
                {t("skillsEmpty")}
              </li>
            )}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
