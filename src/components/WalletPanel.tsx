import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Copy,
  ExternalLink,
  LogOut,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  CheckCheck,
} from "lucide-react";
import { useVaultApp } from "@/context/VaultAppContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;
const EXPLORER_BASE = "https://sepolia.starkscan.co";

interface Transaction {
  type: "deposit" | "withdraw";
  txHash: string;
  amount: string;       // satoshis as string
  feeCharged: string;
  blockTimestamp: string;
}

interface ApiTransaction {
  type: "deposit" | "withdraw";
  txHash: string;
  amount: string;
  feeCharged: string;
  blockTimestamp: string;
  sharesMinted?: string;
  sharesBurned?: string;
}

const satsToBtc = (sats: string): string => {
  const n = BigInt(sats);
  const whole = n / 100_000_000n;
  const frac = n % 100_000_000n;
  return `${whole}.${frac.toString().padStart(8, "0").replace(/0+$/, "") || "0"}`;
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const truncateTx = (hash: string): string =>
  `${hash.slice(0, 8)}...${hash.slice(-6)}`;

interface WalletPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WalletPanel = ({ open, onOpenChange }: WalletPanelProps) => {
  const { address, disconnect, vaultData } = useVaultApp();
  const [copied, setCopied] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!address) return;
    setTxLoading(true);
    setTxError(false);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/user/${address}/transactions?limit=20&offset=0`
      );
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setTransactions(
        (data.transactions as ApiTransaction[]).map((t) => ({
          type: t.type,
          txHash: t.txHash,
          amount: t.amount,
          feeCharged: t.feeCharged,
          blockTimestamp: t.blockTimestamp,
        }))
      );
    } catch {
      setTxError(true);
    } finally {
      setTxLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (open && address) {
      fetchTransactions();
    }
  }, [open, address, fetchTransactions]);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    onOpenChange(false);
    disconnect();
  };

  if (!address) return null;

  const wbtcBtc = satsToBtc(vaultData.wbtcBalance.toString());
  const vaultBtc = satsToBtc(vaultData.vaultBalance.toString());
  const rbBtcBtc = satsToBtc(vaultData.rbBtcBalance.toString());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[420px] flex flex-col gap-0 p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-base font-semibold">My Wallet</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-6 space-y-6 pb-6">
            {/* Address card */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Address
                </span>
                <Badge variant="outline" className="text-xs text-green-500 border-green-500/30 bg-green-500/5">
                  Connected
                </Badge>
              </div>
              <p className="font-mono text-sm break-all leading-relaxed text-foreground/90">
                {address}
              </p>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 text-xs h-8"
                  onClick={copyAddress}
                >
                  {copied ? (
                    <><CheckCheck className="w-3.5 h-3.5 text-green-500" /> Copied</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 text-xs h-8"
                  asChild
                >
                  <a
                    href={`${EXPLORER_BASE}/contract/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Explorer
                  </a>
                </Button>
              </div>
            </div>

            {/* Balances */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Balances
              </p>
              <div className="rounded-xl border border-border/60 bg-muted/30 divide-y divide-border/40">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-orange-500">W</span>
                    </div>
                    <span className="text-sm font-medium">WBTC</span>
                  </div>
                  <span className="font-mono text-sm">{wbtcBtc}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">rb</span>
                    </div>
                    <span className="text-sm font-medium">rbBTC (Shares)</span>
                  </div>
                  <span className="font-mono text-sm">{rbBtcBtc}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-500">V</span>
                    </div>
                    <span className="text-sm font-medium">Vault Position</span>
                  </div>
                  <span className="font-mono text-sm">{vaultBtc} BTC</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Transaction History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Transaction History
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={fetchTransactions}
                  disabled={txLoading}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${txLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {txLoading && (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              )}

              {txError && !txLoading && (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                  Failed to load transactions.{" "}
                  <button
                    className="text-primary underline underline-offset-2"
                    onClick={fetchTransactions}
                  >
                    Retry
                  </button>
                </div>
              )}

              {!txLoading && !txError && transactions.length === 0 && (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-6 text-center">
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Your deposits and withdrawals will appear here
                  </p>
                </div>
              )}

              {!txLoading && !txError && transactions.length > 0 && (
                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const isDeposit = tx.type === "deposit";
                    return (
                      <div
                        key={tx.txHash}
                        className="rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                                isDeposit
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-orange-500/10 text-orange-500"
                              }`}
                            >
                              {isDeposit ? (
                                <ArrowDownToLine className="w-4 h-4" />
                              ) : (
                                <ArrowUpFromLine className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium capitalize">{tx.type}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(tx.blockTimestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p
                              className={`text-sm font-semibold font-mono ${
                                isDeposit ? "text-green-500" : "text-orange-500"
                              }`}
                            >
                              {isDeposit ? "+" : "-"}{satsToBtc(tx.amount)} BTC
                            </p>
                            {BigInt(tx.feeCharged) > 0n && (
                              <p className="text-xs text-muted-foreground">
                                fee: {satsToBtc(tx.feeCharged)} BTC
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between pl-10">
                          <span className="font-mono text-xs text-muted-foreground/70">
                            {truncateTx(tx.txHash)}
                          </span>
                          <a
                            href={`${EXPLORER_BASE}/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer — Disconnect */}
        <div className="px-6 py-4 border-t border-border/40">
          <Button
            variant="outline"
            className="w-full gap-2 text-sm text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive/50"
            onClick={handleDisconnect}
          >
            <LogOut className="w-4 h-4" />
            Disconnect Wallet
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
