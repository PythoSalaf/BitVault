import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, X, Send, Bot, User, Loader2,
  ShieldCheck, ChevronDown, TrendingUp, Wallet,
  BarChart3, Activity, Lock, Zap, AlertCircle,
  ArrowDownToLine, CheckCircle2, ExternalLink,
} from "lucide-react";
import { useVaultApp } from "@/context/VaultAppContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ToolCard {
  name: string;
  data: Record<string, unknown>;
  loading: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  cards?: ToolCard[];
}

// ─── Inline Display Cards (Glove-inspired Display Stack) ─────────────────────

function VaultStatusCard({ data }: { data: Record<string, unknown> }) {
  const tiers = (data.tiers as Array<{ id: string; name: string; apy: string; lockDays: number; risk: string }>) ?? [];
  return (
    <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 overflow-hidden text-xs mt-2">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-orange-500/10">
        <Activity className="w-3.5 h-3.5 text-orange-500" />
        <span className="font-semibold text-orange-500">Vault Status</span>
        <span className={`ml-auto flex items-center gap-1 text-[10px] font-medium ${data.isPaused ? 'text-red-400' : 'text-green-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${data.isPaused ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`} />
          {data.isPaused ? 'Paused' : 'Active'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-orange-500/10 text-[11px]">
        {[
          ['TVL', `${data.tvlBtc} BTC`],
          ['BTC Price', `$${data.btcPriceUsd}`],
          ['TVL (USD)', `$${Number(data.tvlUsd as string).toLocaleString()}`],
          ['Deposit Fee', `${data.depositFee}%`],
        ].map(([label, value]) => (
          <div key={label} className="bg-background/60 px-3 py-2">
            <p className="text-muted-foreground">{label}</p>
            <p className="font-semibold mt-0.5">{value}</p>
          </div>
        ))}
      </div>
      {tiers.length > 0 && (
        <div className="px-3 py-2 space-y-1.5">
          {tiers.map(t => (
            <div key={t.id} className="flex items-center justify-between">
              <span className="text-muted-foreground capitalize">{t.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${Math.min((parseFloat(t.apy) / 10) * 100, 100)}%` }}
                  />
                </div>
                <span className="font-semibold text-orange-400 w-10 text-right">{t.apy}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PortfolioCard({ data }: { data: Record<string, unknown> }) {
  if (!data.connected) {
    return (
      <div className="rounded-xl border border-border/40 bg-muted/20 px-3 py-3 mt-2 text-xs flex items-center gap-2 text-muted-foreground">
        <AlertCircle className="w-3.5 h-3.5" />
        No wallet connected — connect your wallet to see your portfolio.
      </div>
    );
  }
  const txs = (data.recentTransactions as Array<{ type: string; amount: string; date: string }>) ?? [];
  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 overflow-hidden text-xs mt-2">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-blue-500/10">
        <Wallet className="w-3.5 h-3.5 text-blue-400" />
        <span className="font-semibold text-blue-400">Your Portfolio</span>
      </div>
      <div className="grid grid-cols-3 gap-px bg-blue-500/10">
        {[
          ['WBTC', `${data.wbtcBalance} BTC`, 'Available'],
          ['Vault', `${data.vaultPosition} BTC`, 'Deposited'],
          ['rbBTC', `${data.rbBtcShares}`, 'Shares'],
        ].map(([label, value, sub]) => (
          <div key={label} className="bg-background/60 px-2 py-2 text-center">
            <p className="text-muted-foreground text-[10px]">{sub}</p>
            <p className="font-bold text-[11px] mt-0.5 truncate">{value}</p>
            <p className="text-muted-foreground/60 text-[9px]">{label}</p>
          </div>
        ))}
      </div>
      {txs.length > 0 && (
        <div className="px-3 py-2 space-y-1">
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">Recent</p>
          {txs.map((tx, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className={`font-medium ${tx.type === 'deposit' ? 'text-green-400' : 'text-orange-400'}`}>
                {tx.type === 'deposit' ? '+' : '-'}{tx.amount} BTC
              </span>
              <span className="text-muted-foreground text-[10px]">
                {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApyCard({ data }: { data: Record<string, unknown> }) {
  const tiers = (data.tiers as Array<{
    id: string; name: string; apy: string; lockDays: number; risk: string; description: string; multiplier: number;
  }>) ?? [];
  const maxApy = Math.max(...tiers.map(t => parseFloat(t.apy)));
  const riskColor = (r: string) =>
    r === 'low' ? 'text-green-400 bg-green-400/10' :
    r === 'medium' ? 'text-yellow-400 bg-yellow-400/10' :
    'text-red-400 bg-red-400/10';

  return (
    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 overflow-hidden text-xs mt-2">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-purple-500/10">
        <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
        <span className="font-semibold text-purple-400">APY Comparison</span>
      </div>
      <div className="p-2 space-y-2">
        {tiers.map(t => (
          <div key={t.id} className="rounded-lg border border-border/40 bg-background/50 p-2.5">
            <div className="flex items-start justify-between mb-1.5">
              <div>
                <div className="flex items-center gap-1.5">
                  {t.lockDays === 0 ? <Zap className="w-3 h-3 text-green-400" /> : <Lock className="w-3 h-3 text-muted-foreground" />}
                  <span className="font-semibold">{t.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize ${riskColor(t.risk)}`}>{t.risk}</span>
                </div>
                <p className="text-muted-foreground mt-0.5 text-[10px]">
                  {t.lockDays === 0 ? 'No lock — withdraw anytime' : `${t.lockDays}-day lock`}
                </p>
              </div>
              <span className="text-lg font-bold text-orange-400">{t.apy}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all"
                style={{ width: `${(parseFloat(t.apy) / maxApy) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DepositCard({ data }: { data: Record<string, unknown> }) {
  const { deposit, approveWBTC, checkAllowance, address, connect } = useVaultApp();
  const tiers = (data.tiers as Array<{ id: string; name: string; apy: string; lockDays: number; risk: string }>) ?? [];
  const [selectedTier, setSelectedTier] = useState((data.suggestedTier as string) ?? tiers[0]?.id ?? 'flexible');
  const [amount, setAmount] = useState((data.suggestedAmount as string) ?? '');
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const connected = Boolean(address);
  const wbtcBal = parseFloat((data.wbtcBalance as string) || '0');
  const depositFee = parseFloat((data.depositFee as string) || '1.00');
  const parsedAmount = parseFloat(amount) || 0;
  const feeAmt = parsedAmount * (depositFee / 100);
  const netAmt = parsedAmount - feeAmt;
  const insufficient = parsedAmount > wbtcBal && wbtcBal > 0;
  const canSubmit = connected && parsedAmount > 0 && !insufficient && step === 'idle';

  const setPreset = (pct: number) => setAmount((wbtcBal * pct / 100).toFixed(8));

  const handleDeposit = async () => {
    if (!canSubmit) return;
    setErrMsg(null);
    try {
      setStep('approving');
      const hasAllowance = await checkAllowance(amount);
      if (!hasAllowance) {
        const approveTx = await approveWBTC(amount);
        if (!approveTx) throw new Error('Approval rejected');
      }
      setStep('depositing');
      const hash = await deposit(amount);
      if (!hash) throw new Error('Deposit rejected');
      setTxHash(hash);
      setStep('success');
    } catch (err) {
      setErrMsg((err as Error).message ?? 'Transaction failed');
      setStep('error');
    }
  };

  if (!connected) {
    return (
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 overflow-hidden text-xs mt-2">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-green-500/10">
          <ArrowDownToLine className="w-3.5 h-3.5 text-green-400" />
          <span className="font-semibold text-green-400">Deposit to Vault</span>
        </div>
        <div className="px-3 py-3 text-center space-y-2">
          <p className="text-muted-foreground">Connect your wallet to deposit</p>
          <Button size="sm" onClick={connect} className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 overflow-hidden text-xs mt-2">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-green-500/10">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
          <span className="font-semibold text-green-400">Deposit Successful!</span>
        </div>
        <div className="px-3 py-3 space-y-2">
          <p className="text-muted-foreground">
            Deposited <span className="text-foreground font-semibold">{amount} WBTC</span> into the{' '}
            <span className="capitalize font-semibold text-orange-400">{selectedTier}</span> vault
          </p>
          {txHash && (
            <a
              href={`https://sepolia.starkscan.co/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-orange-400 hover:text-orange-300 underline"
            >
              View on Starkscan <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-green-500/20 bg-green-500/5 overflow-hidden text-xs mt-2">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-green-500/10">
        <ArrowDownToLine className="w-3.5 h-3.5 text-green-400" />
        <span className="font-semibold text-green-400">Deposit to Vault</span>
        <span className="ml-auto text-muted-foreground">Balance: {wbtcBal.toFixed(6)} WBTC</span>
      </div>

      {/* Tier selector */}
      <div className="px-3 pt-2.5 pb-1.5">
        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide mb-1.5">Select Tier</p>
        <div className="flex gap-1">
          {tiers.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTier(t.id)}
              className={`flex-1 py-1.5 rounded-lg border text-center transition-colors ${
                selectedTier === t.id
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                  : 'border-border/40 bg-background/40 text-muted-foreground hover:border-border'
              }`}
            >
              <div className="font-semibold">{t.name}</div>
              <div className="text-[10px] text-orange-400">{t.apy}%</div>
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="px-3 pb-1.5">
        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide mb-1.5">Amount (WBTC)</p>
        <div className="flex gap-1 mb-1.5">
          {[25, 50, 75, 100].map(pct => (
            <button
              key={pct}
              onClick={() => setPreset(pct)}
              className="flex-1 py-1 rounded border border-border/40 text-[10px] text-muted-foreground hover:border-border hover:text-foreground transition-colors"
            >
              {pct === 100 ? 'Max' : `${pct}%`}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00000000"
          className="w-full px-2.5 py-1.5 rounded-lg border border-border/60 bg-background/80 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-foreground"
          step="0.00000001"
          min="0"
        />
        {insufficient && <p className="text-red-400 text-[10px] mt-1">Insufficient WBTC balance</p>}
      </div>

      {/* Fee preview */}
      {parsedAmount > 0 && (
        <div className="mx-3 mb-2 rounded-lg border border-border/30 bg-background/40 p-2 space-y-0.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Deposit fee ({depositFee}%)</span>
            <span>-{feeAmt.toFixed(8)} WBTC</span>
          </div>
          <div className="flex justify-between text-[10px] font-semibold">
            <span className="text-muted-foreground">Net deposit</span>
            <span className="text-green-400">{netAmt.toFixed(8)} WBTC</span>
          </div>
        </div>
      )}

      {/* Error */}
      {step === 'error' && errMsg && (
        <div className="mx-3 mb-2 flex items-center gap-1.5 text-[10px] text-red-400">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {errMsg}
        </div>
      )}

      {/* Submit */}
      <div className="px-3 pb-3">
        <Button
          size="sm"
          onClick={handleDeposit}
          disabled={!canSubmit}
          className="w-full h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
        >
          {step === 'approving' ? (
            <><Loader2 className="w-3 h-3 animate-spin mr-1.5" />Approving WBTC...</>
          ) : step === 'depositing' ? (
            <><Loader2 className="w-3 h-3 animate-spin mr-1.5" />Depositing...</>
          ) : step === 'error' ? (
            'Retry Deposit'
          ) : (
            'Approve & Deposit'
          )}
        </Button>
      </div>
    </div>
  );
}

function LoadingCard({ name }: { name: string }) {
  const label =
    name === 'show_vault_status'   ? 'Fetching vault status...' :
    name === 'show_user_portfolio' ? 'Loading your portfolio...' :
    name === 'show_deposit_form'   ? 'Preparing deposit form...' :
    'Comparing vault tiers...';
  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5 mt-2 flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      {label}
    </div>
  );
}

function InlineCard({ card }: { card: ToolCard }) {
  if (card.loading) return <LoadingCard name={card.name} />;
  if (card.name === 'show_vault_status')   return <VaultStatusCard data={card.data} />;
  if (card.name === 'show_user_portfolio') return <PortfolioCard data={card.data} />;
  if (card.name === 'show_apy_comparison') return <ApyCard data={card.data} />;
  if (card.name === 'show_deposit_form')   return <DepositCard data={card.data} />;
  return null;
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${isUser ? "bg-primary/20" : "bg-orange-500/10"}`}>
        {isUser ? <User className="w-3.5 h-3.5 text-primary" /> : <Bot className="w-3.5 h-3.5 text-orange-500" />}
      </div>

      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Cards render above the text bubble for assistant messages */}
        {!isUser && message.cards && message.cards.map((card, i) => (
          <InlineCard key={`${card.name}-${i}`} card={card} />
        ))}

        {/* Text bubble — only show if there's content or it's still streaming */}
        {(message.content || message.streaming) && (
          <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed mt-1 ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted/60 text-foreground rounded-tl-sm"
          }`}>
            {message.streaming && message.content === "" ? (
              <span className="flex gap-1 items-center py-0.5">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            ) : (
              <span className="whitespace-pre-wrap">{message.content}</span>
            )}
            {message.streaming && message.content !== "" && (
              <span className="inline-block w-0.5 h-3.5 bg-current ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Suggested Questions ──────────────────────────────────────────────────────

const SUGGESTED = [
  { label: "Vault status", q: "Show me the current vault status" },
  { label: "My portfolio", q: "Show my portfolio and vault position" },
  { label: "Compare tiers", q: "Compare all vault tiers and APY" },
  { label: "Deposit now", q: "I want to deposit WBTC into the vault" },
  { label: "How does yield work?", q: "How does BitVault generate yield?" },
  { label: "Best tier for me?", q: "Which vault tier should I choose?" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function AiAdvisor() {
  const { address } = useVaultApp();
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]     = useState("");
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const scrollRef             = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLTextAreaElement>(null);
  const abortRef              = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const updateLastAssistant = useCallback(
    (updater: (prev: Message) => Message) => {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = updater(last);
        }
        return updated;
      });
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      setError(null);
      const userMsg: Message      = { role: "user", content: trimmed };
      const assistantMsg: Message = { role: "assistant", content: "", streaming: true, cards: [] };

      setMessages(prev => [...prev, userMsg, assistantMsg]);
      setInput("");
      setBusy(true);

      const history = [...messages, userMsg].map(({ role, content }) => ({ role, content }));
      abortRef.current = new AbortController();

      try {
        const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ messages: history, address: address ?? undefined }),
          signal:  abortRef.current.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
        }

        const reader  = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer    = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") break;

            try {
              const ev = JSON.parse(payload) as {
                type: string; content?: string; name?: string; data?: Record<string, unknown>; error?: string;
              };

              if (ev.type === "text" && ev.content) {
                updateLastAssistant(m => ({ ...m, content: m.content + ev.content! }));
              } else if (ev.type === "tool_start" && ev.name) {
                // Add loading card — skip if this tool already has a card
                updateLastAssistant(m => {
                  if (m.cards?.some(c => c.name === ev.name)) return m;
                  return { ...m, cards: [...(m.cards ?? []), { name: ev.name!, data: {}, loading: true }] };
                });
              } else if (ev.type === "tool_result" && ev.name && ev.data) {
                // Replace loading card with data
                updateLastAssistant(m => ({
                  ...m,
                  cards: (m.cards ?? []).map(c =>
                    c.name === ev.name && c.loading
                      ? { name: ev.name!, data: ev.data!, loading: false }
                      : c
                  ),
                }));
              } else if (ev.type === "error") {
                throw new Error(ev.content ?? "AI error");
              }
            } catch (parseErr) {
              const msg = (parseErr as Error).message;
              if (msg !== "Unexpected end of JSON input") throw parseErr;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message ?? "Something went wrong");
        setMessages(prev => prev.slice(0, -1));
      } finally {
        updateLastAssistant(m => ({ ...m, streaming: false }));
        setBusy(false);
        abortRef.current = null;
        inputRef.current?.focus();
      }
    },
    [messages, busy, address, updateLastAssistant]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 ${
          open
            ? "bg-muted border border-border text-muted-foreground"
            : "bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_24px_rgba(249,115,22,0.4)]"
        }`}
      >
        {open ? <ChevronDown className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        <span className="text-sm font-semibold">{open ? "Minimize" : "BitVault AI"}</span>
        {!open && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] flex flex-col rounded-2xl border border-border/60 bg-background shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">BitVault AI</p>
                <p className="text-xs text-muted-foreground">Yield strategy advisor</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] gap-1 border-green-500/30 text-green-500 bg-green-500/5 px-1.5 py-0.5">
                <ShieldCheck className="w-2.5 h-2.5" />
                On-chain only
              </Badge>
              <button
                onClick={() => { abortRef.current?.abort(); setOpen(false); }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="h-[420px] overflow-y-auto px-4 py-4 space-y-4">
            {isEmpty && (
              <div className="space-y-4">
                <div className="text-center space-y-1.5 pt-2">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto">
                    <TrendingUp className="w-6 h-6 text-orange-500" />
                  </div>
                  <p className="text-sm font-medium">BitVault Intelligence</p>
                  <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                    I can show live vault data, compare tiers, and give personalized yield strategy advice.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {SUGGESTED.map(({ label, q }) => (
                    <button
                      key={label}
                      onClick={() => sendMessage(q)}
                      className="text-left text-xs px-2.5 py-2 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border transition-colors text-foreground/80 leading-tight"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2 border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border/40 p-3 bg-muted/10">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your yield strategy..."
                className="resize-none min-h-[40px] max-h-[100px] text-sm rounded-xl border-border/60 bg-background/80 focus-visible:ring-1 focus-visible:ring-orange-500"
                rows={1}
                disabled={busy}
              />
              <Button
                size="sm"
                onClick={() => sendMessage(input)}
                disabled={busy || !input.trim()}
                className="h-10 w-10 p-0 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
              Powered by Gemini · Privacy-preserving · On-chain data only
            </p>
          </div>
        </div>
      )}
    </>
  );
}
