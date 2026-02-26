import { Contract, RpcProvider, Abi } from "starknet";
import btcVaultAbi from "./abis/btc_vault.json";
import rbBTCAbi from "./abis/rbBTC.json";

// Sepolia Addresses from VESU_CONTRACT_DOC.md
export const WBTC_ADDRESS = "0xabbd6f1e590eb83addd87ba5ac27960d859b1f17d11a3c1cd6a0006704b1410";
export const VESU_SINGLETON = "0x01ecab07456147a8de92b9273dd6789893401e8462a737431493980d9be6827";
export const VESU_EXTENSION = "0x0571efca8cae0e426cb7052dad04badded0855b4cd6c6f475639af3356bc33fe";
export const POOL_ID = "730993554056884283224259059297934576024721456828383733531590831263129347422";

// Deployed addresses on Starknet Sepolia
export const BTC_VAULT_ADDRESS = "0x49e64c4b60ee6d18b49fe198eed2f79ee74ceb719c74a6882eeea35a0c5b0d1"; 
export const RB_BTC_ADDRESS = "0x6bc02e5684bf7174af01d5c4d72303cb89338a3cc6df719c46a634521198364";

const provider = new RpcProvider({
  nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8",
});

// WBTC Contract (Standard ERC20)
// Using rbBTC ABI as it's also an ERC20
export const wbtcContract = new Contract(rbBTCAbi.abi as Abi, WBTC_ADDRESS, provider);

// rbBTC Token Contract
export const rbBTC = new Contract(rbBTCAbi.abi as Abi, RB_BTC_ADDRESS, provider);

// BTC Vault Contract
export const btc_vault = new Contract(btcVaultAbi.abi as Abi, BTC_VAULT_ADDRESS, provider);
