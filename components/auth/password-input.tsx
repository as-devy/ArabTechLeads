"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  className?: string;
};

export function PasswordInput({
  name,
  label,
  placeholder,
  autoComplete,
  required,
  hint,
  className,
}: Props) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          className="flex h-11 w-full rounded-md border border-border bg-surface-elevated pe-11 ps-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute end-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
