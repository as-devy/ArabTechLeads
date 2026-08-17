"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SKILLS } from "@/lib/constants/taxonomy";
import { createProjectAction } from "@/lib/actions/projects";
import {
  PROJECT_STATUSES,
  PROJECT_TYPES,
  SUGGESTED_PROJECT_ROLES,
} from "@/lib/projects/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const steps = ["basics", "classify", "tech", "team", "links", "review"] as const;

export function ProjectCreateWizard() {
  const t = useTranslations("app.projects.wizard");
  const tp = useTranslations("app.projects");
  const [step, setStep] = useState(0);
  const [tech, setTech] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [looking, setLooking] = useState(true);

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  return (
    <form action={createProjectAction} className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <ol className="flex flex-wrap gap-2 text-xs">
        {steps.map((key, i) => (
          <li
            key={key}
            className={`rounded-full border px-2.5 py-1 ${i === step ? "border-accent bg-accent-muted" : "border-border text-muted"}`}
          >
            {i + 1}. {t(key)}
          </li>
        ))}
      </ol>

      <div className={step === 0 ? "space-y-3" : "hidden"}>
        <Input name="name" required label={t("name")} />
        <Input name="slug" label={t("slug")} dir="ltr" className="text-start" />
        <Input name="shortDescription" required label={t("short")} />
        <label className="block text-sm font-medium">{t("long")}</label>
        <textarea name="description" rows={5} className="w-full rounded-md border border-border bg-surface-elevated p-3 text-sm" />
      </div>

      <div className={step === 1 ? "space-y-3" : "hidden"}>
        <label className="block text-sm">{t("classify")}</label>
        <select name="projectType" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
          {PROJECT_TYPES.map((type) => (
            <option key={type} value={type}>
              {tp(`types.${type}`)}
            </option>
          ))}
        </select>
        <select name="status" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
          {PROJECT_STATUSES.filter((s) => s === "PLANNING" || s === "IN_PROGRESS").map((status) => (
            <option key={status} value={status}>
              {tp(`status.${status}`)}
            </option>
          ))}
        </select>
      </div>

      <div className={step === 2 ? "space-y-3" : "hidden"}>
        <p className="text-sm text-secondary">{t("tech")}</p>
        <input type="hidden" name="technologies" value={tech.join(",")} />
        <div className="flex flex-wrap gap-1.5">
          {SKILLS.slice(0, 28).map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => toggle(tech, skill, setTech)}
              className={`rounded-md border px-2 py-1 text-xs dir-ltr ${tech.includes(skill) ? "border-accent bg-accent-muted" : "border-border"}`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      <div className={step === 3 ? "space-y-3" : "hidden"}>
        <p className="text-sm">{t("looking")}</p>
        <input type="hidden" name="looking" value={looking ? "yes" : "no"} />
        <input type="hidden" name="roles" value={roles.join(",")} />
        <div className="flex gap-2">
          <button type="button" onClick={() => setLooking(true)} className={`rounded-md border px-3 py-1.5 text-sm ${looking ? "border-accent bg-accent-muted" : "border-border"}`}>
            {t("yes")}
          </button>
          <button type="button" onClick={() => setLooking(false)} className={`rounded-md border px-3 py-1.5 text-sm ${!looking ? "border-accent bg-accent-muted" : "border-border"}`}>
            {t("no")}
          </button>
        </div>
        {looking ? (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROJECT_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggle(roles, role, setRoles)}
                className={`rounded-md border px-2 py-1 text-xs ${roles.includes(role) ? "border-accent bg-accent-muted" : "border-border"}`}
              >
                {role}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={step === 4 ? "space-y-3" : "hidden"}>
        <Input name="githubUrl" label={t("github")} dir="ltr" className="text-start" />
        <Input name="websiteUrl" label={t("website")} dir="ltr" className="text-start" />
        <Input name="demoUrl" label={t("demo")} dir="ltr" className="text-start" />
        <Input name="figmaUrl" label={t("figma")} dir="ltr" className="text-start" />
        <select name="visibility" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
          <option value="PUBLIC">{t("public")}</option>
          <option value="PRIVATE">{t("private")}</option>
        </select>
      </div>

      <div className={step === 5 ? "space-y-2 text-sm text-secondary" : "hidden"}>
        <p>{t("review")}</p>
        <p className="dir-ltr">{tech.join(" · ")}</p>
        <p>{roles.join(" · ")}</p>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          {t("back")}
        </Button>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={() => setStep((s) => s + 1)}>
            {t("next")}
          </Button>
        ) : (
          <Button type="submit">{t("publish")}</Button>
        )}
      </div>
    </form>
  );
}
