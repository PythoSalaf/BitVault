import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

type ApyPoint = { date: string; flexible: number; balanced: number; maximum: number };
type TvlPoint = { date: string; tvlUsd: number };

const Placeholder = () => (
  <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
    Awaiting 24h of chain data
  </div>
);

export const AnalyticsCharts = () => {
  const [apyData, setApyData] = useState<ApyPoint[]>([]);
  const [tvlData, setTvlData] = useState<TvlPoint[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/analytics/apy-history?days=30`).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/analytics/tvl-history?days=30`).then(r => r.json()),
    ])
      .then(([apy, tvl]) => {
        setApyData(apy);
        setTvlData(tvl);
      })
      .catch(console.error);
  }, []);

  return (
    <section className="py-20 px-4 container mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Performance Analytics</h2>
        <p className="text-muted-foreground text-lg">Track yield trends and platform growth</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <Card className="p-6 bg-card border-border">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            APY Trend
          </h3>
          {apyData.length === 0 ? <Placeholder /> : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={apyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Line type="monotone" dataKey="balanced" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ fill: "hsl(var(--accent))", r: 4 }} name="Balanced" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6 bg-card border-border">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            Total Value Locked
          </h3>
          {tvlData.length === 0 ? <Placeholder /> : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={tvlData}>
                <defs>
                  <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                  tickFormatter={(v) => `$${v.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "TVL"]}
                />
                <Area
                  type="monotone"
                  dataKey="tvlUsd"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fill="url(#tvlGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </section>
  );
};
