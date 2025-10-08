import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, TrendingUp, Clock } from "lucide-react";

const vaults = [
  {
    name: "Flexible Vault",
    lockPeriod: "7 days",
    apy: "6.5%",
    tvl: "$8.2M",
    risk: "Low",
    description: "Short-term lock with instant liquidity access",
  },
  {
    name: "Balanced Vault",
    lockPeriod: "30 days",
    apy: "9.8%",
    tvl: "$18.5M",
    risk: "Medium",
    description: "Optimal balance between yield and flexibility",
    featured: true,
  },
  {
    name: "Maximum Yield",
    lockPeriod: "90 days",
    apy: "12.4%",
    tvl: "$15.8M",
    risk: "Medium",
    description: "Highest returns for long-term holders",
  },
];

export const VaultCards = () => {
  return (
    <section className="py-20 px-4 container mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Vault</h2>
        <p className="text-muted-foreground text-lg">Select a lock-up period that matches your investment strategy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {vaults.map((vault, index) => (
          <Card 
            key={index}
            className={`p-8 bg-card border-border relative overflow-hidden group transition-all duration-300 ${
              vault.featured 
                ? 'border-primary shadow-lg shadow-primary/20 scale-105' 
                : 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'
            }`}
          >
            {vault.featured && (
              <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="outline" className="border-accent/30 text-accent">
                  {vault.risk} Risk
                </Badge>
              </div>

              <h3 className="text-2xl font-bold mb-2">{vault.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{vault.description}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between py-3 border-t border-border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">APY</span>
                </div>
                <span className="text-2xl font-bold text-accent">{vault.apy}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Lock Period</span>
                </div>
                <span className="font-semibold">{vault.lockPeriod}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-border">
                <span className="text-sm text-muted-foreground">Total Locked</span>
                <span className="font-semibold">{vault.tvl}</span>
              </div>
            </div>

            <Button 
              className={`w-full font-semibold ${
                vault.featured 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(247,147,26,0.3)]' 
                  : 'bg-muted hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              Deposit BTC
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
};
