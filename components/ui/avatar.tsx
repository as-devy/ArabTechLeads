import { cn } from "@/lib/utils";

type Props = {
  name?: string | null;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizes = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
  xl: "size-24 text-2xl",
};

function initials(name?: string | null) {
  if (!name) return "AT";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Avatar({ name, src, size = "md", className }: Props) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? ""}
        className={cn(
          "shrink-0 rounded-full border border-border object-cover",
          sizes[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent-muted font-semibold text-accent",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
