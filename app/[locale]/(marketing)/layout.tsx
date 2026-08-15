import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function MarketingLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-full flex-col">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
