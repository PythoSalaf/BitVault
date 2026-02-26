import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Percent, Users, Activity, BarChart3 } from "lucide-react";
import { useVaultApp } from "@/context/VaultAppContext";
import { formatUnits } from "viem";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const WBTC_DECIMALS = 8;

const apyHistoryData = [
  { date: "Jan", flexible: 5.2, balanced: 7.8, maximum: 10.2 },
  { date: "Feb", flexible: 5.8, balanced: 8.1, maximum: 10.8 },
  { date: "Mar", flexible: 6.1, balanced: 8.5, maximum: 11.2 },
  { date: "Apr", flexible: 6.3, balanced: 9.2, maximum: 11.8 },
  { date: "May", flexible: 6.5, balanced: 9.8, maximum: 12.1 },
  { date: "Jun", flexible: 6.5, balanced: 9.8, maximum: 12.4 },
];

const tvlHistoryData = [
  { date: "Jan", tvl: 28.5 },
  { date: "Feb", tvl: 32.2 },
  { date: "Mar", tvl: 35.8 },
  { date: "Apr", tvl: 38.4 },
  { date: "May", tvl: 40.2 },
  { date: "Jun", tvl: 42.5 },
];

const volumeData = [
  { date: "Mon", deposits: 2.4, withdrawals: 1.2 },
  { date: "Tue", deposits: 3.1, withdrawals: 1.8 },
  { date: "Wed", deposits: 2.8, withdrawals: 1.5 },
  { date: "Thu", deposits: 3.5, withdrawals: 2.1 },
  { date: "Fri", deposits: 4.2, withdrawals: 1.9 },
  { date: "Sat", deposits: 3.8, withdrawals: 2.3 },
  { date: "Sun", deposits: 2.9, withdrawals: 1.6 },
];

const vaultDistribution = [
  { name: "Flexible", value: 8200000, color: "hsl(var(--accent))" },
  { name: "Balanced", value: 18500000, color: "hsl(var(--primary))" },
  { name: "Maximum", value: 15800000, color: "hsl(var(--secondary))" },
];

const Analytics = () => {
  const { vaultData } = useVaultApp();

  const tvlBtc = formatUnits(vaultData.totalDeposited, WBTC_DECIMALS);
  const btcPrice = formatUnits(vaultData.btcPrice, 8); // Oracle usually 8 decimals
  const tvlUsd = (parseFloat(tvlBtc) * parseFloat(btcPrice)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const metrics = [
    {
      title: "Total Value Locked",
      value: `${tvlBtc} BTC`,
      subValue: `$${tvlUsd}`,
      change: "+12.3%",
      icon: DollarSign,
      color: "text-primary",
    },
    {
      title: "Average APY",
      value: "9.8%",
      change: "+1.2%",
      icon: Percent,
      color: "text-accent",
    },
    {
      title: "BTC Price",
      value: `$${parseFloat(btcPrice).toLocaleString()}`,
      change: "+3.4%",
      icon: TrendingUp,
      color: "text-secondary",
    },
    {
      title: "24h Volume",
      value: "$3.2M",
      change: "+5.7%",
      icon: Activity,
      color: "text-foreground",
    },
  ];

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
          {metrics.map((metric, index) => {
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
                  <span className="text-sm font-medium text-accent">{metric.change}</span>
                </div>
                <h3 className="text-2xl font-bold mb-1">{metric.value}</h3>
                {metric.subValue && <p className="text-sm font-medium text-muted-foreground mb-1">{metric.subValue}</p>}
                <p className="text-sm text-muted-foreground">{metric.title}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Charts Section */}
      <section className="py-8 px-4 container mx-auto">
        <Tabs defaultValue="apy" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="apy">APY Trends</TabsTrigger>
            <TabsTrigger value="tvl">TVL</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
          </TabsList>

          <TabsContent value="apy" className="space-y-8">
            <Card className="p-6 bg-card border-border">
              <h3 className="text-xl font-bold mb-6">APY History by Vault Type</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={apyHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="flexible"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    name="Flexible"
                  />
                  <Line
                    type="monotone"
                    dataKey="balanced"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Balanced"
                  />
                  <Line
                    type="monotone"
                    dataKey="maximum"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    name="Maximum"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="tvl" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6 bg-card border-border">
                <h3 className="text-xl font-bold mb-6">Total Value Locked Growth</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={tvlHistoryData}>
                    <defs>
                      <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: "12px" }}
                      tickFormatter={(value) => `$${value}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`$${value}M`, "TVL"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="tvl"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fill="url(#tvlGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 bg-card border-border">
                <h3 className="text-xl font-bold mb-6">TVL Distribution by Vault</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={vaultDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {vaultDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="volume" className="space-y-8">
            <Card className="p-6 bg-card border-border">
              <h3 className="text-xl font-bold mb-6">7-Day Deposit & Withdrawal Volume</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(value) => `$${value}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => `$${value}M`}
                  />
                  <Bar dataKey="deposits" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="withdrawals" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <Footer />
    </div>
  );
};

export default Analytics;
