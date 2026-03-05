import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, TrendingUp, Wallet, ArrowRight, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useVaultApp } from "@/context/VaultAppContext";
import { formatUnits } from "viem";

const WBTC_DECIMALS = 8;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

interface VaultDisplay {
  id: string;
  name: string;
  lockPeriod: string;
  apy: string;
  risk: string;
  minDeposit: string;
  description: string;
  tvl?: string;
  featured?: boolean;
}

const DEFAULT_VAULTS: VaultDisplay[] = [
  {
    id: "flexible",
    name: "Flexible Vault",
    lockPeriod: "No lock",
    apy: "—",
    risk: "Low",
    minDeposit: "0.001 BTC",
    description: "No lock period. Withdraw anytime. Base yield from Vesu lending.",
  },
  {
    id: "balanced",
    name: "Balanced Vault",
    lockPeriod: "30 days",
    apy: "—",
    risk: "Medium",
    minDeposit: "0.001 BTC",
    description: "30-day lock. Higher yield through optimized position management.",
    featured: true,
  },
  {
    id: "maximum",
    name: "Maximum Vault",
    lockPeriod: "90 days",
    apy: "—",
    risk: "High",
    minDeposit: "0.001 BTC",
    description: "90-day lock. Maximum yield with active rebalancing strategy.",
  },
];

const Vaults = () => {
  const {
    wallet,
    address,
    connect,
    vaultData,
    loading,
    deposit,
    withdraw,
    checkAllowance,
    approveWBTC
  } = useVaultApp();

  const [searchParams] = useSearchParams();
  const [vaults, setVaults] = useState<VaultDisplay[]>(DEFAULT_VAULTS);
  const [selectedVault, setSelectedVault] = useState(
    searchParams.get("tier") ?? DEFAULT_VAULTS[1].id
  );

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/vault/config`)
      .then(r => r.json())
      .then((tiers: Array<{
        id: string; name: string; lockPeriodDays: number;
        currentApy: number; minDepositBtc: number; riskLevel: string;
        description: string;
      }>) => {
        setVaults(tiers.map(t => ({
          id:          t.id,
          name:        `${t.name} Vault`,
          lockPeriod:  t.lockPeriodDays === 0 ? "No lock" : `${t.lockPeriodDays} days`,
          apy:         t.currentApy > 0 ? `${t.currentApy.toFixed(1)}%` : "—",
          risk:        t.riskLevel.charAt(0).toUpperCase() + t.riskLevel.slice(1),
          minDeposit:  `${t.minDepositBtc} BTC`,
          description: t.description,
          featured:    t.id === "balanced",
        })));
      })
      .catch(console.error);
  }, []);
  const [actionType, setActionType] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentVault = vaults.find(v => v.id === selectedVault);

  const formattedBalance = useMemo(() => {
    return formatUnits(vaultData.wbtcBalance, WBTC_DECIMALS);
  }, [vaultData.wbtcBalance]);

  const handleAction = async () => {
    if (!wallet) {
      await connect();
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error(`Please enter a valid ${actionType} amount`);
      return;
    }

    try {
      if (actionType === "deposit") {
        // Step 1: Check Allowance
        const hasAllowance = await checkAllowance(amount);

        if (!hasAllowance) {
          setIsApproving(true);
          toast.info("Approving WBTC...", { description: "Please confirm in your wallet" });
          const approveTx = await approveWBTC(amount);
          if (!approveTx) throw new Error("Approval failed");
          setIsApproving(false);
        }

        // Step 2: Deposit
        setIsProcessing(true);
        toast.info("Depositing to Vault...", { description: "Please confirm in your wallet" });
        const depositTx = await deposit(amount);
        if (!depositTx) throw new Error("Deposit failed");

        toast.success("Successfully deposited!", {
          description: `Tx Hash: ${depositTx.slice(0, 10)}...`,
        });
      } else {
        // Withdraw Flow
        setIsProcessing(true);
        toast.info("Withdrawing from Vault...", { description: "Please confirm in your wallet" });
        const withdrawTx = await withdraw(amount);
        if (!withdrawTx) throw new Error("Withdraw failed");

        toast.success("Successfully withdrawn!", {
          description: `Tx Hash: ${withdrawTx.slice(0, 10)}...`,
        });
      }
      setAmount("");
    } catch (err) {
      toast.error("Transaction failed", { description: (err as Error).message });
    } finally {
      setIsApproving(false);
      setIsProcessing(false);
    }
  };

  const calculatedFee = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) return "0.0000";
    if (actionType === "withdraw") return "0.0000"; // Withdrawals typically might not have the same fee structure or handled differently

    // Fee rate is scaled by 10000 (e.g. 100 = 1%)
    const feeDecimal = Number(vaultData.depositFeeRate) / 10000;
    return (parseFloat(amount) * feeDecimal).toFixed(4);
  }, [amount, actionType, vaultData.depositFeeRate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 px-4 container mx-auto">
        <div className="text-center mb-12">
          <div className={`inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border ${address ? 'border-green-500/20 bg-green-500/5 text-green-500' : 'border-primary/20 bg-primary/5 text-primary'}`}>
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-medium">
              {address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Wallet Not Connected'}
            </span>
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
                          <p className="text-lg font-semibold">{vault.tvl ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Risk Level</p>
                          <Badge variant="outline" className="border-accent/30 text-accent">
                            {vault.risk}
                          </Badge>
                        </div>
                      </div>

                      {/* Action Type Toggle */}
                      <div className="flex bg-muted/50 p-1 rounded-lg">
                        <button
                          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${actionType === 'deposit' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                          onClick={() => setActionType('deposit')}
                        >
                          Deposit
                        </button>
                        <button
                          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${actionType === 'withdraw' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                          onClick={() => setActionType('withdraw')}
                        >
                          Withdraw
                        </button>
                      </div>

                      {/* Input */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block capitalize">
                            {actionType} Amount
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="text-2xl h-16 pr-20 bg-background"
                              step="0.01"
                              min="0"
                              disabled={isApproving || isProcessing}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                {actionType === "deposit" ? "BTC" : "rbBTC"}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 flex justify-between">
                            <span>Min: {vault.minDeposit}</span>
                            <span>
                              Balance: {actionType === "deposit" ? formattedBalance : formatUnits(vaultData.vaultBalance, WBTC_DECIMALS)} {actionType === "deposit" ? "WBTC" : "rbBTC"}
                            </span>
                          </p>
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="flex gap-2">
                          {["0.01", "0.05", "0.1", "Max"].map((preset) => (
                            <Button
                              key={preset}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (preset === "Max") {
                                  setAmount(actionType === "deposit" ? formattedBalance : formatUnits(vaultData.vaultBalance, WBTC_DECIMALS));
                                } else {
                                  setAmount(preset);
                                }
                              }}
                              disabled={isApproving || isProcessing}
                            >
                              {preset} {preset !== "Max" && "BTC"}
                            </Button>
                          ))}
                        </div>

                        {/* Action Button */}
                        <Button
                          size="lg"
                          className="w-full text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(247,147,26,0.3)] hover:shadow-[0_0_40px_rgba(247,147,26,0.5)] capitalize"
                          onClick={handleAction}
                          disabled={isApproving || isProcessing}
                        >
                          {isApproving || isProcessing ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          ) : (
                            <Wallet className="mr-2" />
                          )}
                          {!wallet
                            ? "Connect Wallet to Continue"
                            : isApproving
                              ? "Approving WBTC..."
                              : isProcessing
                                ? "Processing..."
                                : `${actionType} to ${currentVault?.name}`}
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
                    <span className="text-sm text-muted-foreground capitalize">{actionType} Amount</span>
                    <span className="font-semibold">
                      {amount || "0.00"} {actionType === 'deposit' ? 'WBTC' : 'rbBTC'}
                    </span>
                  </div>
                  {actionType === 'deposit' && (
                    <div className="flex justify-between py-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Protocol Fee</span>
                      <span className="font-semibold text-destructive">
                        {calculatedFee} WBTC
                      </span>
                    </div>
                  )}
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
                      {amount
                        ? (parseFloat(amount) * (parseFloat(currentVault?.apy || "0") / 100)).toFixed(4)
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
