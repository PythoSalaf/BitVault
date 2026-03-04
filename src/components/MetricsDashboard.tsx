import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, DollarSign, Percent, Users } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

interface LiveMetrics {
  tvlUsd: number;
  btcPriceUsd: number;
  activeUsers: number;
}

export const MetricsDashboard = () => {
  const [data, setData] = useState<LiveMetrics | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/analytics/metrics`).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/price/btc`).then(r => r.json()),
    ])
      .then(([m, p]) => {
        setData({
          tvlUsd:      m.tvlUsd      ?? 0,
          btcPriceUsd: p.priceUsd   ?? 0,
          activeUsers: m.activeUsers ?? 0,
        });
      })
      .catch(console.error);
  }, []);

  const fmt = (n: number, opts?: Intl.NumberFormatOptions) =>
    n.toLocaleString(undefined, opts);

  const cards = [
    {
      title: "Total Value Locked",
      value: data ? `$${fmt(data.tvlUsd, { maximumFractionDigits: 2 })}` : "—",
      icon:  DollarSign,
      color: "text-primary",
    },
    {
      title: "Average APY",
      value: "—",
      icon:  Percent,
      color: "text-accent",
    },
    {
      title: "BTC Price",
      value: data ? `$${fmt(data.btcPriceUsd)}` : "—",
      icon:  TrendingUp,
      color: "text-secondary",
    },
    {
      title: "Active Users",
      value: data ? fmt(data.activeUsers) : "—",
      icon:  Users,
      color: "text-foreground",
    },
  ];

  return (
    <section className="py-20 px-4 container mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Live Platform Metrics</h2>
        <p className="text-muted-foreground text-lg">Real-time data from the Starknet blockchain</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={index}
              className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-muted/50 ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-2">{card.value}</h3>
              <p className="text-sm text-muted-foreground">{card.title}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
