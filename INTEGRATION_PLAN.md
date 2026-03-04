# BitVault Integration Plan
# Frontend ↔ Backend ↔ Contracts

---

## Step 1 — Fix frontend environment config ✅ DONE
- `.env` created with all VITE_ variables
- `WalletConnect.tsx` reads RPC URL from `import.meta.env.VITE_RPC_URL`
- `VaultAppContext.tsx` imports from `@/lib/contracts` (not the Cairo folder)
- `src/lib/contracts.ts` created — instantiates wbtcContract, rbBTC, btc_vault from env addresses
- ABIs present in `src/contracts/abis/` (btc_vault.json, rbBTC.json, wbtc_abi.json)
- Frontend builds with 0 TypeScript errors ✅

---

## Step 2 — Fix WBTC contract binding ✅ DONE
- `wbtcContract` defined in `src/lib/contracts.ts` using wbtc_abi.json
- wbtc_abi.json has: balance_of, approve, allowance ✅
- `approveWBTC()` in VaultAppContext awaits tx confirmation ✅
- `checkAllowance()` added to context ✅

---

## Step 3 — Fix the deposit/withdraw flow ✅ DONE
- `Vaults.tsx` connected to `useVaultApp()` context ✅
- Full flow: checkAllowance → approveWBTC (await confirmation) → deposit ✅
- Withdraw flow wired ✅
- Fee preview calculated from live `vaultData.depositFeeRate` ✅
- Loading states (isApproving, isProcessing) + toast notifications ✅
- Max button reads live WBTC balance ✅

---

## Step 4 — Wire frontend to backend API ✅ DONE
- `fetchVaultData()` now calls 3 backend endpoints in parallel (+ 2 direct contract calls)
- `wbtcBalance`, `rbBtcBalance` → direct contract calls (real-time per user)
- `vaultBalance` → `GET /api/user/:address/balance`
- `totalDeposited`, `isPaused`, `depositFeeRate`, `vaultPosition` → `GET /api/vault/status`
- `btcPrice` → `GET /api/price/btc` (has CoinGecko fallback)
- `BACKEND_URL` reads from `import.meta.env.VITE_BACKEND_URL`
- `btc_vault` contract kept only for deposit/withdraw write operations

---

## Step 5 — Replace hardcoded UI data ✅ DONE
- `MetricsDashboard.tsx`: fetches `/api/analytics/metrics` + `/api/price/btc` → live TVL, BTC price, active users
- `VaultCards.tsx`: fetches `/api/vault/config` → live APY, lock period, min deposit, risk
- `AnalyticsCharts.tsx`: fetches `/api/analytics/apy-history` + `/api/analytics/tvl-history` → shows "Awaiting 24h of chain data" when empty
- `Vaults.tsx`: fetches `/api/vault/config` on mount, maps to VaultDisplay type; falls back to defaults while loading
- `Analytics.tsx`: full rewrite — fetches all 6 endpoints on mount (apy-history, tvl-history, volume, distribution, metrics, price/btc); placeholder shown for empty charts
- APY shows "—" until 24h of chain data has accumulated (expected, not a bug)

---

## Step 6 — Fix backend WBTC contract binding ✅ DONE
- Added `ERC20_ABI` (balance_of only) to `src/config/constants.ts`
- Added `WbtcContract` class to `src/starknet/contracts.ts`; exported `wbtc` singleton
- Updated `vaultService.getUserBalance()` to return `wbtcBalance` + `wbtcBalanceBtc` fields
- `GET /api/user/:address/balance` now returns: wbtcBalance, vaultBalance, rbBtcBalance (all 3)
- Known limitation: Sepolia WBTC address (0xabbd6f...) exceeds the Starknet prime, so
  Alchemy v0_10 rejects direct calls to it. WbtcContract.balanceOf() catches the error and
  returns 0n. Frontend fetches live WBTC balance via direct contract call (unaffected).

---

## Step 7 — Fix backend price service reliability ✅ DONE
- `priceService.ts` falls back to CoinGecko free API when oracle returns 0 or throws
- In-memory cache with 5 min TTL prevents CoinGecko rate-limiting
- Returns `source: 'oracle_cached' | 'oracle_live' | 'coingecko_cached' | 'coingecko'`
- `getAllState()` wraps Vesu calls (getVaultPosition, getAssetStats, getAssetPrice) in individual try/catch → returns 0 fallbacks before first deposit

---

## Step 8 — Start backend + verify indexer/poller ✅ DONE
- Backend runs on port 3001 with Fastify + pino-pretty
- Fixed: provider must use `blockIdentifier: 'latest'` (Alchemy rejects "pending")
- Fixed: `INDEXER_START_BLOCK` set to 7183950 (near deployment block, not 0)
- All routes verified:
  - `GET /health` → `{ status: "ok", database: "connected" }`
  - `GET /api/vault/status` → snapshot with fee rates (50/50/1000), paused: false
  - `GET /api/vault/config` → 3 vault tiers with APY
  - `GET /api/price/btc` → $68,401 from CoinGecko (oracle not active until first deposit)
  - `GET /api/user/:address/balance` → vault + rbBTC balances
  - `GET /api/user/:address/transactions` → empty array (no txs yet)
  - `GET /api/analytics/metrics` → aggregated metrics
  - `GET /api/analytics/tvl-history` → daily TVL entries
  - `GET /api/analytics/apy-history` → APY snapshots
  - `GET /api/analytics/volume` → deposit/withdraw volume
  - `GET /api/analytics/distribution` → tier breakdown
- Poller writes vault snapshot every 30s (11 snapshots after first few minutes)
- Indexer scanning from block 7183950, currently at 7184473

---

## Step 9 — Analytics page end-to-end ✅ DONE
- `Analytics.tsx` fully rewritten — fetches all 6 endpoints on mount in a single `Promise.all`
- `apyHistory`, `tvlHistory`, `volumeData`, `distribution`, `metrics`, `btcPrice` all live
- Volume converted from satoshis → BTC for chart display
- Empty state: shows `<Placeholder>` ("Awaiting chain data") when arrays are empty
- No longer depends on `useVaultApp()` context — works without wallet connection
- APY metric card shows "—" until 24h of on-chain data accumulates (expected)

---

## Step 10 — End-to-end test with real wallet ⬜ TODO
**Problem:** Full flow untested with real wallet and Sepolia WBTC.

**Work:**
- Connect ArgentX or Braavos to local dev frontend
- Get Sepolia WBTC from a faucet or bridge
- Run full flow: approve → deposit → rbBTC minted → balance updates in DB → withdraw → rbBTC burned
- Verify events in `deposit_events` table
- Verify snapshots in `vault_snapshots` table

---

## Deployed Contract Addresses (Starknet Sepolia)
- rbBTC:     0x6bc02e5684bf7174af01d5c4d72303cb89338a3cc6df719c46a634521198364
- btc_vault: 0x49e64c4b60ee6d18b49fe198eed2f79ee74ceb719c74a6882eeea35a0c5b0d1
- WBTC:      0xabbd6f1e590eb83addd87ba5ac27960d859b1f17d11a3c1cd6a0006704b1410
