import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AppHeader } from "@/components/navigation/app-header";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { VoiceSessionProvider } from "@/components/voice/voice-session-provider";
import { getCurrentProfile, getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PlatformLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (profile && !profile.onboardingCompleted) {
    redirect("/onboarding");
  }

  if (profile?.suspendedAt) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="max-w-md text-center text-sm text-secondary">
          This account is suspended. Contact ArabTechLeads moderation if you believe this is a mistake.
        </p>
      </div>
    );
  }

  const unread = profile
    ? await prisma.notification.count({
        where: { recipientId: profile.id, isRead: false },
      })
    : 0;

  const roleName =
    locale === "ar" ? profile?.role?.nameAr : profile?.role?.nameEn;

  return (
    <VoiceSessionProvider profileId={profile?.id ?? user.id}>
    <div className="flex min-h-dvh bg-background">
      <AppSidebar
        profile={{
          username: profile?.username,
          fullName: profile?.fullName,
          avatarUrl: profile?.avatarUrl,
        }}
        roleName={roleName}
      />
      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
        <AppHeader
          name={profile?.fullName}
          avatarUrl={profile?.avatarUrl}
          unreadNotifications={unread}
        />
        <main className="flex-1">{children}</main>
      </div>
      <MobileNav username={profile?.username} />
    </div>
    </VoiceSessionProvider>
  );
}
