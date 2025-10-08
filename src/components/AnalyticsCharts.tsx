import { Card } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const apyData = [
  { date: "Jan", apy: 7.2 },
  { date: "Feb", apy: 8.1 },
  { date: "Mar", apy: 7.8 },
  { date: "Apr", apy: 9.2 },
  { date: "May", apy: 9.8 },
  { date: "Jun", apy: 10.5 },
];

const tvlData = [
  { date: "Jan", tvl: 28 },
  { date: "Feb", tvl: 32 },
  { date: "Mar", tvl: 35 },
  { date: "Apr", tvl: 38 },
  { date: "May", tvl: 40 },
  { date: "Jun", tvl: 42.5 },
];

export const AnalyticsCharts = () => {
  return (
    <section className="py-20 px-4 container mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Performance Analytics</h2>
        <p className="text-muted-foreground text-lg">Track yield trends and platform growth</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <Card className="p-6 bg-card border-border">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent"></div>
            APY Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={apyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                formatter={(value: number) => [`${value}%`, 'APY']}
              />
              <Line 
                type="monotone" 
                dataKey="apy" 
                stroke="hsl(var(--accent))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--accent))', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-card border-border">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            Total Value Locked
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={tvlData}>
              <defs>
                <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value}M`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                formatter={(value: number) => [`$${value}M`, 'TVL']}
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
      </div>
    </section>
  );
};
