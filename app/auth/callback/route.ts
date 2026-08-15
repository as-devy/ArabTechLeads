import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const email = user.email ?? "";
        const fullName =
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          null;
        const avatarUrl =
          (user.user_metadata?.avatar_url as string | undefined) ||
          (user.user_metadata?.picture as string | undefined) ||
          null;

        try {
          await prisma.profile.upsert({
            where: { id: user.id },
            update: {
              email,
              ...(fullName ? { fullName } : {}),
              ...(avatarUrl ? { avatarUrl } : {}),
            },
            create: {
              id: user.id,
              email,
              fullName,
              avatarUrl,
            },
          });

          if (next) {
            return NextResponse.redirect(`${origin}${next}`);
          }

          const profile = await prisma.profile.findUnique({
            where: { id: user.id },
            select: { onboardingCompleted: true },
          });

          return NextResponse.redirect(
            `${origin}${profile?.onboardingCompleted ? "/app" : "/onboarding"}`,
          );
        } catch {
          return NextResponse.redirect(
            `${origin}${next ?? "/onboarding"}`,
          );
        }
      }

      return NextResponse.redirect(`${origin}${next ?? "/onboarding"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
