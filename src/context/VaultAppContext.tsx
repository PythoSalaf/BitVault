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
  //   wbtcContract,
  rbBTC,
  btc_vault,
  //   oracleContract,
} from "../contracts/contracts/src";
import { uint256 } from "starknet";
import { parseUnits } from "viem"; // For parsing amounts

const WBTC_DECIMALS = 8;

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
      const [
        wbtcBal,
        rbBal,
        vaultBal,
        totalDep,
        price,
        paused,
        feeRate,
        position,
      ] = await Promise.all([
        wbtcContract.getBalance(wallet, addr),
        rbBTC.getBalance(wallet, addr),
        btc_vault.getUserBalance(addr),
        btc_vault.getTotalDeposited(),
        // oracleContract.getBtcUsdPrice(),
        btc_vault.isPaused(),
        btc_vault.getDepositFeeRate(),
        btc_vault.getVaultPosition(),
      ]);

      setVaultData({
        wbtcBalance: wbtcBal,
        rbBtcBalance: rbBal,
        vaultBalance: vaultBal,
        totalDeposited: totalDep,
        btcPrice: price,
        isPaused: paused,
        depositFeeRate: feeRate,
        vaultPosition: position,
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
        const txHash = await wbtcContract.approve(
          wallet,
          VAULT_ADDRESS,
          amount
        );
        // In production, wait for tx confirmation before proceeding
        return txHash;
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
        // Assume approval is handled separately or check allowance first
        const txHash = await btc_vault.deposit(wallet, amount);
        await refreshVaultData(); // Refresh after success
        return txHash;
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
        const txHash = await btc_vault.withdraw(wallet, amount);
        await refreshVaultData(); // Refresh after success
        return txHash;
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
