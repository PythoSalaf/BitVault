import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { WalletAccount } from "starknet";
import { connectWallet } from "@/lib/WalletConnect";
import {
  wbtcContract,
  rbBTC,
  btc_vault,
  BTC_VAULT_ADDRESS,
} from "@/lib/contracts";
import { parseUnits } from "viem"; // For parsing amounts

const WBTC_DECIMALS = 8;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

interface VaultData {
  wbtcBalance: bigint;
  rbBtcBalance: bigint;
  vaultBalance: bigint;
  totalDeposited: bigint;
  btcPrice: bigint;
  isPaused: boolean;
  depositFeeRate: bigint;
  vaultPosition: { collateral: bigint; debt: bigint };
}

interface VaultAppContextType {
  // Wallet
  wallet: WalletAccount | null;
  address: string | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;

  // Vault Data
  vaultData: VaultData;
  loading: boolean;
  error: string | null;
  refreshVaultData: () => Promise<void>;

  // Actions
  checkAllowance: (amount: string) => Promise<boolean>;
  approveWBTC: (amount: string) => Promise<string | null>;
  deposit: (amount: string) => Promise<string | null>;
  withdraw: (amount: string) => Promise<string | null>;
}

const VaultAppContext = createContext<VaultAppContextType | undefined>(
  undefined
);

export const VaultAppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Wallet State
  const [wallet, setWallet] = useState<WalletAccount | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Vault State
  const [vaultData, setVaultData] = useState<VaultData>({
    wbtcBalance: 0n,
    rbBtcBalance: 0n,
    vaultBalance: 0n,
    totalDeposited: 0n,
    btcPrice: 0n,
    isPaused: false,
    depositFeeRate: 0n,
    vaultPosition: { collateral: 0n, debt: 0n },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect Wallet
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const account = await connectWallet();
      setWallet(account);
      setAddress(account.address);
    } catch (err) {
      setError("Failed to connect wallet");
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect Wallet
  const disconnect = useCallback(() => {
    setWallet(null);
    setAddress(null);
    setVaultData({
      wbtcBalance: 0n,
      rbBtcBalance: 0n,
      vaultBalance: 0n,
      totalDeposited: 0n,
      btcPrice: 0n,
      isPaused: false,
      depositFeeRate: 0n,
      vaultPosition: { collateral: 0n, debt: 0n },
    });
  }, []);

  // Fetch Vault Data
  const fetchVaultData = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);
    setError(null);
    try {
      const addr = wallet.address;

      // Real-time per-user token balances — stay as direct contract calls
      wbtcContract.connect(wallet);
      rbBTC.connect(wallet);

      const [wbtcBal, rbBal, statusRes, priceRes, userBalRes] = await Promise.all([
        wbtcContract.balance_of(addr),
        rbBTC.balance_of(addr),
        fetch(`${BACKEND_URL}/api/vault/status`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/price/btc`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/user/${addr}/balance`).then(r => r.json()),
      ]);

      setVaultData({
        wbtcBalance:    BigInt(wbtcBal.toString()),
        rbBtcBalance:   BigInt(rbBal.toString()),
        vaultBalance:   BigInt(userBalRes.vaultBalance   ?? '0'),
        totalDeposited: BigInt(statusRes.totalDeposited  ?? '0'),
        btcPrice:       BigInt(Math.round((priceRes.priceUsd ?? 0) * 1e8)),
        isPaused:       statusRes.isPaused ?? false,
        depositFeeRate: BigInt(statusRes.depositFeeRate  ?? '0'),
        vaultPosition: {
          collateral: BigInt(statusRes.vesuCollateral ?? '0'),
          debt:       BigInt(statusRes.vesuDebt       ?? '0'),
        },
      });
    } catch (err) {
      setError("Failed to fetch vault data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  // Refresh Vault Data (public method)
  const refreshVaultData = useCallback(
    () => fetchVaultData(),
    [fetchVaultData]
  );

  // Approve WBTC
  const approveWBTC = useCallback(
    async (amountStr: string) => {
      if (!wallet) {
        setError("Wallet not connected");
        return null;
      }
      const amount = parseUnits(amountStr, WBTC_DECIMALS);
      if (amount <= 0n) {
        setError("Invalid amount");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        wbtcContract.connect(wallet);
        const { transaction_hash } = await wbtcContract.approve(
          BTC_VAULT_ADDRESS,
          amount
        );

        await wbtcContract.providerOrAccount.waitForTransaction(transaction_hash);
        return transaction_hash;
      } catch (err) {
        setError("Approval failed");
        console.error(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet]
  );

  // Check Allowance
  const checkAllowance = useCallback(
    async (amountStr: string) => {
      if (!wallet) return false;
      const amount = parseUnits(amountStr, WBTC_DECIMALS);
      if (amount <= 0n) return false;

      try {
        const allowance = await wbtcContract.allowance(wallet.address, BTC_VAULT_ADDRESS);
        return BigInt(allowance.toString()) >= amount;
      } catch (err) {
        console.error("Failed to check allowance:", err);
        return false;
      }
    },
    [wallet]
  );

  // Deposit
  const deposit = useCallback(
    async (amountStr: string) => {
      if (!wallet) {
        setError("Wallet not connected");
        return null;
      }
      const amount = parseUnits(amountStr, WBTC_DECIMALS);
      if (amount <= 0n || amount > vaultData.wbtcBalance) {
        setError("Invalid amount");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        btc_vault.connect(wallet);
        const { transaction_hash } = await btc_vault.deposit_to_vesu(amount);
        await btc_vault.providerOrAccount.waitForTransaction(transaction_hash);
        await refreshVaultData(); // Refresh after success
        return transaction_hash;
      } catch (err) {
        setError("Deposit failed");
        console.error(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet, vaultData.wbtcBalance, refreshVaultData]
  );

  // Withdraw
  const withdraw = useCallback(
    async (amountStr: string) => {
      if (!wallet) {
        setError("Wallet not connected");
        return null;
      }
      const amount = parseUnits(amountStr, WBTC_DECIMALS);
      if (amount <= 0n || amount > vaultData.vaultBalance) {
        setError("Invalid amount");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        btc_vault.connect(wallet);
        const { transaction_hash } = await btc_vault.withdraw_from_vesu(amount);
        await btc_vault.providerOrAccount.waitForTransaction(transaction_hash);
        await refreshVaultData(); // Refresh after success
        return transaction_hash;
      } catch (err) {
        setError("Withdraw failed");
        console.error(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet, vaultData.vaultBalance, refreshVaultData]
  );

  // Effects
  useEffect(() => {
    if (wallet) {
      fetchVaultData();
      // Poll every 30s
      const interval = setInterval(fetchVaultData, 30000);
      return () => clearInterval(interval);
    }
  }, [wallet, fetchVaultData]);

  const value: VaultAppContextType = {
    wallet,
    address,
    isConnecting,
    connect,
    disconnect,
    vaultData,
    loading,
    error,
    refreshVaultData,
    checkAllowance,
    approveWBTC,
    deposit,
    withdraw,
  };

  return (
    <VaultAppContext.Provider value={value}>
      {children}
    </VaultAppContext.Provider>
  );
};

export const useVaultApp = () => {
  const context = useContext(VaultAppContext);
  if (!context) {
    throw new Error("useVaultApp must be used within VaultAppProvider");
  }
  return context;
};
