import { setRequestLocale } from "next-intl/server";
import { CodeShareSection } from "@/components/marketing/code-share-section";
import { CommunitiesSection } from "@/components/marketing/communities-section";
import { DiscoverySection } from "@/components/marketing/discovery-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { NetworkSection } from "@/components/marketing/network-section";
import { WhySection } from "@/components/marketing/why-section";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MarketingHomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <WhySection />
      <DiscoverySection />
      <CodeShareSection />
      <CommunitiesSection />
      <NetworkSection />
      <FinalCtaSection />
    </>
  );
}
