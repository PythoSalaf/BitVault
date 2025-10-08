import { Card } from "@/components/ui/card";
import { TrendingUp, DollarSign, Percent, Users } from "lucide-react";

const metrics = [
  {
    title: "Total Value Locked",
    value: "$42.5M",
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
    value: "$65,432",
    change: "+3.4%",
    icon: TrendingUp,
    color: "text-secondary",
  },
  {
    title: "Active Vaults",
    value: "1,247",
    change: "+89",
    icon: Users,
    color: "text-foreground",
  },
];

export const MetricsDashboard = () => {
  return (
    <section className="py-20 px-4 container mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Live Platform Metrics</h2>
        <p className="text-muted-foreground text-lg">Real-time data from the Starknet blockchain</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card 
              key={index}
              className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-muted/50 ${metric.color} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-accent">{metric.change}</span>
              </div>
              
              <h3 className="text-3xl font-bold mb-2">{metric.value}</h3>
              <p className="text-sm text-muted-foreground">{metric.title}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
