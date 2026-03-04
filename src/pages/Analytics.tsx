import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Percent, Activity, BarChart3 } from "lucide-react";
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

type ApyPoint  = { date: string; flexible: number; balanced: number; maximum: number };
type TvlPoint  = { date: string; tvlUsd: number };
type VolPoint  = { date: string; deposits: string; withdrawals: string };
type DistEntry = { tier: string; tvlUsd: string; percentage: number };

const TIER_COLORS: Record<string, string> = {
  flexible: "hsl(var(--accent))",
  balanced: "hsl(var(--primary))",
  maximum:  "hsl(var(--secondary))",
};

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
};

const Placeholder = ({ text = "Awaiting chain data" }: { text?: string }) => (
  <div className="flex items-center justify-center h-[350px] text-sm text-muted-foreground">
    {text}
  </div>
);

const Analytics = () => {
  const [apyHistory,   setApyHistory]   = useState<ApyPoint[]>([]);
  const [tvlHistory,   setTvlHistory]   = useState<TvlPoint[]>([]);
  const [volumeData,   setVolumeData]   = useState<VolPoint[]>([]);
  const [distribution, setDistribution] = useState<DistEntry[]>([]);
  const [tvlUsd,       setTvlUsd]       = useState<number>(0);
  const [btcPriceUsd,  setBtcPriceUsd]  = useState<number>(0);
  const [activeUsers,  setActiveUsers]  = useState<number>(0);
  const [volume24h,    setVolume24h]    = useState<string>("0.00000000");

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/analytics/apy-history?days=30`).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/analytics/tvl-history?days=30`).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/analytics/volume?days=7`).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/analytics/distribution`).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/analytics/metrics`).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/price/btc`).then(r => r.json()),
    ])
      .then(([apy, tvl, vol, dist, metrics, price]) => {
        setApyHistory(apy);
        setTvlHistory(tvl);
        setVolumeData(vol);
        setDistribution(dist);
        setTvlUsd(metrics.tvlUsd      ?? 0);
        setActiveUsers(metrics.activeUsers ?? 0);
        setVolume24h(metrics.volume24hBtc  ?? "0.00000000");
        setBtcPriceUsd(price.priceUsd ?? 0);
      })
      .catch(console.error);
  }, []);

  const fmt = (n: number, opts?: Intl.NumberFormatOptions) =>
    n.toLocaleString(undefined, opts);

  const metricCards = [
    {
      title: "Total Value Locked",
      value: `$${fmt(tvlUsd, { maximumFractionDigits: 2 })}`,
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
      value: btcPriceUsd > 0 ? `$${fmt(btcPriceUsd)}` : "—",
      icon:  TrendingUp,
      color: "text-secondary",
    },
    {
      title: "24h Volume",
      value: `${volume24h} BTC`,
      icon:  Activity,
      color: "text-foreground",
    },
  ];

  // Volume data: convert satoshis → BTC for chart display
  const volChartData = volumeData.map(r => ({
    date:        r.date,
    deposits:    Number(r.deposits)    / 1e8,
    withdrawals: Number(r.withdrawals) / 1e8,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="py-12 px-4 container mx-auto border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Platform Analytics</h1>
            <p className="text-muted-foreground">Real-time insights and performance metrics</p>
          </div>
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="py-8 px-4 container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card
                key={index}
                className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-muted/50 ${metric.color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">{metric.value}</h3>
                <p className="text-sm text-muted-foreground">{metric.title}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Charts */}
      <section className="py-8 px-4 container mx-auto">
        <Tabs defaultValue="apy" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="apy">APY Trends</TabsTrigger>
            <TabsTrigger value="tvl">TVL</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
          </TabsList>

          {/* APY Tab */}
          <TabsContent value="apy">
            <Card className="p-6 bg-card border-border">
              <h3 className="text-xl font-bold mb-6">APY History by Vault Type</h3>
              {apyHistory.length === 0
                ? <Placeholder text="APY data accumulates after 24h of chain activity" />
                : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={apyHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: "12px" }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Line type="monotone" dataKey="flexible" stroke="hsl(var(--accent))"     strokeWidth={2} name="Flexible" />
                      <Line type="monotone" dataKey="balanced" stroke="hsl(var(--primary))"    strokeWidth={2} name="Balanced" />
                      <Line type="monotone" dataKey="maximum"  stroke="hsl(var(--secondary))"  strokeWidth={2} name="Maximum"  />
                    </LineChart>
                  </ResponsiveContainer>
                )
              }
            </Card>
          </TabsContent>

          {/* TVL Tab */}
          <TabsContent value="tvl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6 bg-card border-border">
                <h3 className="text-xl font-bold mb-6">Total Value Locked Growth</h3>
                {tvlHistory.length === 0
                  ? <Placeholder />
                  : (
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={tvlHistory}>
                        <defs>
                          <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
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
                          contentStyle={TOOLTIP_STYLE}
                          formatter={(v: number) => [`$${v.toLocaleString()}`, "TVL"]}
                        />
                        <Area type="monotone" dataKey="tvlUsd" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#tvlGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )
                }
              </Card>

              <Card className="p-6 bg-card border-border">
                <h3 className="text-xl font-bold mb-6">TVL Distribution by Vault</h3>
                {distribution.length === 0
                  ? <Placeholder />
                  : (
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={distribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${(name as string).charAt(0).toUpperCase() + (name as string).slice(1)}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={120}
                          dataKey="percentage"
                          nameKey="tier"
                        >
                          {distribution.map((entry) => (
                            <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] ?? "hsl(var(--muted))"} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          formatter={(v: number, _name, props) =>
                            [`$${Number(props.payload?.tvlUsd ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "TVL"]
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )
                }
              </Card>
            </div>
          </TabsContent>

          {/* Volume Tab */}
          <TabsContent value="volume">
            <Card className="p-6 bg-card border-border">
              <h3 className="text-xl font-bold mb-6">7-Day Deposit &amp; Withdrawal Volume</h3>
              {volChartData.length === 0
                ? <Placeholder text="No transactions yet" />
                : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={volChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: "12px" }}
                        tickFormatter={(v) => `${v} BTC`}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(v: number) => [`${v.toFixed(8)} BTC`]}
                      />
                      <Bar dataKey="deposits"    fill="hsl(var(--accent))"    radius={[8, 8, 0, 0]} name="Deposits"    />
                      <Bar dataKey="withdrawals" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} name="Withdrawals" />
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <Footer />
    </div>
  );
};

export default Analytics;
