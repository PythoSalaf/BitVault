import { Hero } from "@/components/Hero";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { VaultCards } from "@/components/VaultCards";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <MetricsDashboard />
      <VaultCards />
      <AnalyticsCharts />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default Index;
