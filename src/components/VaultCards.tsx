import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, TrendingUp, Clock } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

interface TierConfig {
  id: string;
  name: string;
  lockPeriodDays: number;
  currentApy: number;
  minDepositBtc: number;
  riskLevel: string;
  description: string;
}

function lockLabel(days: number): string {
  if (days === 0) return "No lock";
  return `${days} days`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const VaultCards = () => {
  const [tiers, setTiers] = useState<TierConfig[]>([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/vault/config`)
      .then(r => r.json())
      .then(setTiers)
      .catch(console.error);
  }, []);

  return (
    <section className="py-20 px-4 container mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Vault</h2>
        <p className="text-muted-foreground text-lg">Select a lock-up period that matches your investment strategy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {tiers.map((tier) => {
          const featured = tier.id === "balanced";
          return (
            <Card
              key={tier.id}
              className={`p-8 bg-card border-border relative overflow-hidden group transition-all duration-300 ${
                featured
                  ? "border-primary shadow-lg shadow-primary/20 scale-105"
                  : "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
              }`}
            >
              {featured && (
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
                    {capitalize(tier.riskLevel)} Risk
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mb-2">{tier.name} Vault</h3>
                <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-3 border-t border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">APY</span>
                  </div>
                  <span className="text-2xl font-bold text-accent">
                    {tier.currentApy > 0 ? `${tier.currentApy.toFixed(1)}%` : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Lock Period</span>
                  </div>
                  <span className="font-semibold">{lockLabel(tier.lockPeriodDays)}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">Min Deposit</span>
                  <span className="font-semibold">{tier.minDepositBtc} BTC</span>
                </div>
              </div>

              <Button
                className={`w-full font-semibold ${
                  featured
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(247,147,26,0.3)]"
                    : "bg-muted hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                Deposit BTC
              </Button>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
