"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  completeOnboardingAction,
  saveOnboardingBasics,
  saveOnboardingBio,
  saveOnboardingCountry,
  saveOnboardingInterests,
  saveOnboardingRole,
  saveOnboardingSkills,
  type OnboardingActionState,
} from "@/lib/actions/onboarding";
import { SkillsSelector } from "@/components/onboarding/skills-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type RoleOption = { id: string; nameAr: string; nameEn: string };
type SkillOption = { id: string; name: string };
type InterestOption = { id: string; nameAr: string; nameEn: string };
type CountryOption = { code: string; nameAr: string; nameEn: string };

type Props = {
  roles: RoleOption[];
  skills: SkillOption[];
  interests: InterestOption[];
  countries: CountryOption[];
  initial?: {
    fullName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    roleId?: string | null;
    countryCode?: string | null;
    skillIds?: string[];
    interestIds?: string[];
    roleIds?: string[];
  };
};

export function OnboardingWizard({
  roles,
  skills,
  interests,
  countries,
  initial,
}: Props) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initial?.skillIds ?? [],
  );
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    initial?.roleIds?.length
      ? initial.roleIds
      : initial?.roleId
        ? [initial.roleId]
        : [],
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    initial?.interestIds ?? [],
  );
  const [pending, startTransition] = useTransition();

  const steps = useMemo(
    () => [
      t("steps.basics"),
      t("steps.bio"),
      t("steps.role"),
      t("steps.skills"),
      t("steps.interests"),
      t("steps.country"),
      t("steps.finish"),
    ],
    [t],
  );

  function errorMessage(code?: string | null) {
    if (!code) return null;
    try {
      return t(`errors.${code}` as never);
    } catch {
      return t("errors.UNKNOWN_ERROR");
    }
  }

  function fieldError(name: string) {
    const code = fieldErrors[name]?.[0];
    return code ? errorMessage(code) ?? undefined : undefined;
  }

  function runStep(
    action: () => Promise<OnboardingActionState>,
    nextStep: number,
  ) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      if (result.success) {
        setStep(nextStep);
      }
    });
  }

  function toggleRole(id: string) {
    setSelectedRoles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleSkill(id: string) {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleInterest(id: string) {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8">
        <p className="text-sm text-accent">
          {t("stepLabel", { current: step + 1, total: steps.length })}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {steps[step]}
        </h1>
        <div className="mt-5 flex gap-1.5">
          {steps.map((label, index) => (
            <div
              key={label}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                index <= step ? "bg-accent" : "bg-border",
              )}
            />
          ))}
        </div>
      </div>

      {step === 0 ? (
        <form
          className="space-y-4 rounded-lg border border-border bg-surface-elevated p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            runStep(() => saveOnboardingBasics({}, formData), 1);
          }}
        >
          <Input
            name="fullName"
            required
            label={t("fullName")}
            defaultValue={initial?.fullName ?? ""}
            error={fieldError("fullName")}
          />
          <Input
            name="username"
            required
            label={t("username")}
            defaultValue={initial?.username ?? ""}
            dir="ltr"
            className="text-start"
            hint={t("usernameHint")}
            error={fieldError("username")}
          />
          <Input
            name="avatarUrl"
            label={t("avatarUrl")}
            defaultValue={initial?.avatarUrl ?? ""}
            placeholder="https://"
            dir="ltr"
            className="text-start"
            hint={t("avatarHint")}
            error={fieldError("avatarUrl")}
          />
          {error && !fieldError("username") && !fieldError("fullName") && !fieldError("avatarUrl") ? (
            <p className="text-sm text-error" role="alert">
              {errorMessage(error)}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full" size="lg">
            {pending ? t("saving") : t("continue")}
          </Button>
        </form>
      ) : null}

      {step === 1 ? (
        <form
          className="space-y-4 rounded-lg border border-border bg-surface-elevated p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            runStep(() => saveOnboardingBio({}, formData), 2);
          }}
        >
          <Textarea
            name="bio"
            label={t("bio")}
            defaultValue={initial?.bio ?? ""}
            placeholder={t("bioPlaceholder")}
          />
          {error ? (
            <p className="text-sm text-error">{errorMessage(error)}</p>
          ) : null}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(0)}>
              {t("back")}
            </Button>
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? t("saving") : t("continue")}
            </Button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form
          className="space-y-4 rounded-lg border border-border bg-surface-elevated p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData();
            selectedRoles.forEach((id) => formData.append("roleIds", id));
            runStep(() => saveOnboardingRole({}, formData), 3);
          }}
        >
          <p className="text-sm text-secondary">{t("rolesHint")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((role) => {
              const active = selectedRoles.includes(role.id);
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggleRole(role.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-3 text-start transition-colors",
                    active
                      ? "border-accent/50 bg-accent-muted text-foreground"
                      : "border-border text-secondary hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-4 shrink-0 items-center justify-center rounded-sm border",
                      active
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border",
                    )}
                    aria-hidden
                  >
                    {active ? (
                      <span className="block size-2 rounded-[1px] bg-accent-foreground" />
                    ) : null}
                  </span>
                  <span className="dir-ltr text-sm" dir="ltr">
                    {role.nameEn}
                  </span>
                </button>
              );
            })}
          </div>
          {error ? (
            <p className="text-sm text-error">{errorMessage(error)}</p>
          ) : null}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              {t("back")}
            </Button>
            <Button
              type="submit"
              disabled={pending || selectedRoles.length === 0}
              className="flex-1"
            >
              {pending ? t("saving") : t("continue")}
            </Button>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <form
          className="space-y-4 rounded-lg border border-border bg-surface-elevated p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData();
            selectedSkills.forEach((id) => formData.append("skillIds", id));
            runStep(() => saveOnboardingSkills({}, formData), 4);
          }}
        >
          <SkillsSelector
            skills={skills}
            selectedIds={selectedSkills}
            onToggle={toggleSkill}
          />
          {error ? (
            <p className="text-sm text-error">{errorMessage(error)}</p>
          ) : null}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              {t("back")}
            </Button>
            <Button
              type="submit"
              disabled={pending || selectedSkills.length === 0}
              className="flex-1"
            >
              {pending ? t("saving") : t("continue")}
            </Button>
          </div>
        </form>
      ) : null}

      {step === 4 ? (
        <form
          className="space-y-4 rounded-lg border border-border bg-surface-elevated p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData();
            selectedInterests.forEach((id) => formData.append("interestIds", id));
            runStep(() => saveOnboardingInterests({}, formData), 5);
          }}
        >
          <p className="text-sm text-secondary">{t("interestsHint")}</p>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => {
              const active = selectedInterests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => toggleInterest(interest.id)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "border-accent/50 bg-accent-muted text-foreground"
                      : "border-border text-secondary hover:text-foreground",
                  )}
                >
                  {locale === "ar" ? interest.nameAr : interest.nameEn}
                </button>
              );
            })}
          </div>
          {error ? (
            <p className="text-sm text-error">{errorMessage(error)}</p>
          ) : null}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(3)}>
              {t("back")}
            </Button>
            <Button
              type="submit"
              disabled={pending || selectedInterests.length === 0}
              className="flex-1"
            >
              {pending ? t("saving") : t("continue")}
            </Button>
          </div>
        </form>
      ) : null}

      {step === 5 ? (
        <form
          className="space-y-4 rounded-lg border border-border bg-surface-elevated p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            runStep(() => saveOnboardingCountry({}, formData), 6);
          }}
        >
          <p className="text-sm text-secondary">{t("countryHint")}</p>
          <select
            name="countryCode"
            defaultValue={initial?.countryCode ?? ""}
            className="flex h-11 w-full rounded-md border border-border bg-surface-elevated px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <option value="">{t("countryOptional")}</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {locale === "ar" ? country.nameAr : country.nameEn}
              </option>
            ))}
          </select>
          {error ? (
            <p className="text-sm text-error">{errorMessage(error)}</p>
          ) : null}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(4)}>
              {t("back")}
            </Button>
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? t("saving") : t("continue")}
            </Button>
          </div>
        </form>
      ) : null}

      {step === 6 ? (
        <div className="space-y-4 rounded-lg border border-border bg-surface-elevated p-5 sm:p-6">
          <p className="text-secondary leading-7">{t("finishDescription")}</p>
          {error ? (
            <p className="text-sm text-error">{errorMessage(error)}</p>
          ) : null}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(5)}>
              {t("back")}
            </Button>
            <Button
              type="button"
              disabled={pending}
              className="flex-1"
              size="lg"
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await completeOnboardingAction();
                  if (result?.error) setError(result.error);
                });
              }}
            >
              {pending ? t("saving") : t("finish")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
