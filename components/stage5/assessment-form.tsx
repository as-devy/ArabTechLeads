"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { startAssessmentAction, submitAssessmentAction } from "@/lib/actions/stage5";
import { Button } from "@/components/ui/button";
import type { PublicQuestion } from "@/lib/assessments/bank";

export function AssessmentForm({ skillSlug }: { skillSlug: string }) {
  const t = useTranslations("app.stage5");
  const [questions, setQuestions] = useState<PublicQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="rounded-xl border border-border p-4">
      {!questions && !result ? (
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await startAssessmentAction(skillSlug);
              if ("error" in res && res.error) setError(res.error);
              else if ("questions" in res && res.questions) setQuestions(res.questions);
            })
          }
        >
          {t("startAssessment")}
        </Button>
      ) : null}
      {error ? <p className="mt-2 text-sm text-secondary">{t(`errors.${error}`)}</p> : null}
      {questions && !result ? (
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await submitAssessmentAction(skillSlug, answers);
              if (res && "error" in res && res.error) setError(res.error);
              else if (res && "score" in res) setResult(res);
            });
          }}
        >
          {questions.map((q, i) => (
            <fieldset key={q.id} className="rounded-lg border border-border p-3">
              <legend className="text-sm font-medium">
                {i + 1}. {q.prompt}
              </legend>
              <div className="mt-2 space-y-1">
                {q.choices.map((choice, idx) => (
                  <label key={choice} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={q.id}
                      required
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                    />
                    {choice}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <Button type="submit" disabled={pending}>
            {t("submitAssessment")}
          </Button>
        </form>
      ) : null}
      {result ? (
        <p className="mt-3 text-sm">
          {result.score} / {result.total} · {result.passed ? t("passed") : t("failed")}
        </p>
      ) : null}
    </div>
  );
}
