import { connect } from "@starknet-io/get-starknet"; // v4.0.3 min
import { WalletAccount, RpcProvider } from "starknet"; // v7.0.1 min

const myFrontendProviderUrl =
  import.meta.env.VITE_RPC_URL;

/**
 * Connects to a Starknet wallet using the standard UI modal.
 * @returns {Promise<WalletAccount>} The connected wallet account.
 * @throws Error if connection fails.
 */
export async function connectWallet(): Promise<WalletAccount> {
  try {
    // Standard UI to select a wallet
    const selectedWalletSWO = await connect({
      modalMode: "alwaysAsk",
      modalTheme: "dark",
    });

    if (!selectedWalletSWO) {
      throw new Error("No wallet selected");
    }

    // Create a provider explicitly to avoid TypeScript issues with config object
    const provider = new RpcProvider({ nodeUrl: myFrontendProviderUrl });

    // Connect the wallet account to the provider
    const myWalletAccount = await WalletAccount.connect(
      provider,
      selectedWalletSWO
    );

    return myWalletAccount;
  } catch (error) {
    console.error("Wallet connection failed:", error);
    throw new Error(`Failed to connect wallet: ${(error as Error).message}`);
  }
}
