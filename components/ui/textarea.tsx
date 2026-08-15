import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="space-y-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "min-h-28 w-full rounded-md border border-border bg-surface-elevated px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-error focus-visible:ring-error/30",
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error ? <p className="text-xs text-error">{error}</p> : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
