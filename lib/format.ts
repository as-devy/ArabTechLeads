export function formatRelativeTime(date: Date, locale: string) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return locale.startsWith("ar") ? "الآن" : "now";
  if (minutes < 60) return locale.startsWith("ar") ? `${minutes} د` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale.startsWith("ar") ? `${hours} س` : `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return locale.startsWith("ar") ? `${days} ي` : `${days}d`;
  return new Intl.DateTimeFormat(locale.startsWith("ar") ? "ar" : "en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export const CODE_LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "PHP",
  "HTML",
  "CSS",
  "SQL",
  "Bash",
] as const;
