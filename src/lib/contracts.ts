import { Contract, RpcProvider, Abi } from "starknet";
import btcVaultAbi, { abi as vaultAbi } from "../contracts/abis/btc_vault.json";
import rbBTCAbi, { abi as rbAbi } from "../contracts/abis/rbBTC.json";

// We use the 'abi' property if the JSON has it, or the object itself if it's the array
const resolvedBtcVaultAbi = btcVaultAbi.abi || btcVaultAbi;
const resolvedRbBtcAbi = rbBTCAbi.abi || rbBTCAbi;

export const provider = new RpcProvider({
    nodeUrl: import.meta.env.VITE_RPC_URL,
});

// export const wbtcContract = ... (to be implemented in Step 2)

export const rbBTC = new Contract(resolvedRbBtcAbi as Abi, import.meta.env.VITE_RBBTC_ADDRESS, provider);
export const btc_vault = new Contract(resolvedBtcVaultAbi as Abi, import.meta.env.VITE_VAULT_ADDRESS, provider);

export const BTC_VAULT_ADDRESS = import.meta.env.VITE_VAULT_ADDRESS;
