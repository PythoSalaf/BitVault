import { Card } from "@/components/ui/card";
import { Wallet, Lock, TrendingUp, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description: "Link your Starknet wallet (ArgentX or Braavos) and bridge your Bitcoin to wBTC",
    step: "01",
  },
  {
    icon: Lock,
    title: "Choose Vault",
    description: "Select your preferred lock-up period and deposit amount based on your strategy",
    step: "02",
  },
  {
    icon: TrendingUp,
    title: "Earn Yield",
    description: "Watch your Bitcoin grow automatically through optimized DeFi strategies",
    step: "03",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 px-4 container mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
        <p className="text-muted-foreground text-lg">Get started in three simple steps</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative">
        {/* Connection Lines */}
        <div className="hidden md:block absolute top-1/3 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary opacity-30"></div>

        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="relative">
              <Card className="p-8 bg-card border-border hover:border-primary/50 transition-all duration-300 h-full group">
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center font-bold text-primary">
                  {step.step}
                </div>

                <div className="mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>

                {index < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-10 top-1/3 w-6 h-6 text-primary/50" />
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </section>
  );
};
