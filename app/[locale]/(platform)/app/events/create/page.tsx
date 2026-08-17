import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/session";
import { createEventAction } from "@/lib/actions/opportunities";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string }> };

export default async function CreateEventPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const t = await getTranslations("app.opp");
  return (
    <form action={createEventAction} className="mx-auto max-w-xl space-y-3 px-4 py-8">
      <h1 className="text-2xl font-semibold">{t("createEvent")}</h1>
      <input name="title" required className="h-10 w-full rounded-md border border-border px-3 text-sm" />
      <textarea name="description" rows={4} className="w-full rounded-md border border-border p-3 text-sm" />
      <input name="startAt" type="datetime-local" required className="h-10 w-full rounded-md border border-border px-3 text-sm dir-ltr" />
      <input name="location" className="h-10 w-full rounded-md border border-border px-3 text-sm" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isOnline" value="yes" /> Online</label>
      <Button type="submit">{t("createEvent")}</Button>
    </form>
  );
}
