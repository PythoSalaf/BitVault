import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, TrendingUp, Clock, Wallet, ArrowRight, Info } from "lucide-react";
import { toast } from "sonner";

const vaults = [
  {
    id: "flexible",
    name: "Flexible Vault",
    lockPeriod: "7 days",
    apy: "6.5%",
    tvl: "$8.2M",
    risk: "Low",
    minDeposit: "0.01 BTC",
    description: "Short-term lock with instant liquidity access",
  },
  {
    id: "balanced",
    name: "Balanced Vault",
    lockPeriod: "30 days",
    apy: "9.8%",
    tvl: "$18.5M",
    risk: "Medium",
    minDeposit: "0.01 BTC",
    description: "Optimal balance between yield and flexibility",
    featured: true,
  },
  {
    id: "maximum",
    name: "Maximum Yield",
    lockPeriod: "90 days",
    apy: "12.4%",
    tvl: "$15.8M",
    risk: "Medium",
    minDeposit: "0.05 BTC",
    description: "Highest returns for long-term holders",
  },
];

const Vaults = () => {
  const [selectedVault, setSelectedVault] = useState(vaults[1].id);
  const [depositAmount, setDepositAmount] = useState("");

  const currentVault = vaults.find(v => v.id === selectedVault);

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Please enter a valid deposit amount");
      return;
    }
    toast.success(`Depositing ${depositAmount} BTC to ${currentVault?.name}`, {
      description: "Please confirm the transaction in your wallet",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 px-4 container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-primary/20 bg-primary/5">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Wallet Not Connected</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Deposit & Earn</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select a vault, deposit your Bitcoin, and start earning yield through automated DeFi strategies
          </p>
        </div>

        {/* Main Deposit Interface */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Vault Selection */}
            <div className="lg:col-span-2">
              <Card className="p-8 bg-card border-border">
                <Tabs value={selectedVault} onValueChange={setSelectedVault}>
                  <TabsList className="grid w-full grid-cols-3 mb-8">
                    {vaults.map((vault) => (
                      <TabsTrigger
                        key={vault.id}
                        value={vault.id}
                        className="relative data-[state=active]:bg-primary/10"
                      >
                        {vault.name.split(" ")[0]}
                        {vault.featured && (
                          <span className="absolute -top-2 -right-2 w-2 h-2 bg-primary rounded-full" />
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {vaults.map((vault) => (
                    <TabsContent key={vault.id} value={vault.id} className="space-y-6">
                      {/* Vault Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">APY</p>
                          <p className="text-2xl font-bold text-accent">{vault.apy}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Lock Period</p>
                          <p className="text-lg font-semibold">{vault.lockPeriod}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">TVL</p>
                          <p className="text-lg font-semibold">{vault.tvl}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Risk Level</p>
                          <Badge variant="outline" className="border-accent/30 text-accent">
                            {vault.risk}
                          </Badge>
                        </div>
                      </div>

                      {/* Deposit Input */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Deposit Amount
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              className="text-2xl h-16 pr-20 bg-background"
                              step="0.01"
                              min="0"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground">BTC</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Min: {vault.minDeposit} • Your Balance: 0.00 BTC
                          </p>
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="flex gap-2">
                          {["0.1", "0.5", "1.0"].map((amount) => (
                            <Button
                              key={amount}
                              variant="outline"
                              size="sm"
                              onClick={() => setDepositAmount(amount)}
                            >
                              {amount} BTC
                            </Button>
                          ))}
                        </div>

                        {/* Deposit Button */}
                        <Button
                          size="lg"
                          className="w-full text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(247,147,26,0.3)] hover:shadow-[0_0_40px_rgba(247,147,26,0.5)]"
                          onClick={handleDeposit}
                        >
                          <Wallet className="mr-2" />
                          Connect Wallet to Deposit
                          <ArrowRight className="ml-2" />
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <Card className="p-6 bg-card border-border">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Deposit Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Selected Vault</span>
                    <span className="font-semibold">{currentVault?.name}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Deposit Amount</span>
                    <span className="font-semibold">
                      {depositAmount || "0.00"} BTC
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Expected APY</span>
                    <span className="font-semibold text-accent">{currentVault?.apy}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Lock Period</span>
                    <span className="font-semibold">{currentVault?.lockPeriod}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-sm text-muted-foreground">Est. Annual Yield</span>
                    <span className="font-bold text-lg text-accent">
                      {depositAmount
                        ? (parseFloat(depositAmount) * (parseFloat(currentVault?.apy || "0") / 100)).toFixed(4)
                        : "0.0000"}{" "}
                      BTC
                    </span>
                  </div>
                </div>
              </Card>

              {/* Info Card */}
              <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-2">ERC-4626 Standard</h4>
                    <p className="text-sm text-muted-foreground">
                      All vaults follow the ERC-4626 tokenized vault standard, ensuring security and composability.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Vaults;
