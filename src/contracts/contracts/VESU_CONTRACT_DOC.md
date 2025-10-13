# 🚀 **Numo Vault Contract**

## 🏗️ **Integration Architecture**

```mermaid
graph TB
    A[PayStark Frontend] --> B[Vesu SDK]
    A --> C[BTC Vault Contract]
    
    B --> D[Vesu Singleton Contract]
    B --> E[Vesu Extension Contract]
    
    C --> D
    C --> F[rbBTC Token Contract]
    
    D --> G[Genesis Pool]
    E --> H[Pragma Oracle]
    
    I[User Wallet] --> A
    I --> C
```

---

## 🔧 **Integration Components**

### 1. **Enhanced Cairo Contract** (`apps/contracts/src/btc_vault.cairo`)

**Key Features:**

* ✅ **Hardcoded Sepolia addresses**
* ✅ **Fee system** (deposit, withdrawal, performance)
* ✅ **Vault management functions** (pause, fees, etc.)
* ✅ **Integration with price oracles**
* ✅ **Detailed events** for tracking
* ✅ **Security validations**

**Used Sepolia Addresses:**

```cairo
// Vesu Singleton
singleton: 0x01ecab07456147a8de92b9273dd6789893401e8462a737431493980d9be6827

// Extension (Pragma Oracle)  
extension: 0x0571efca8cae0e426cb7052dad04badded0855b4cd6c6f475639af3356bc33fe

// WBTC on Sepolia
wbtc: 0xabbd6f1e590eb83addd87ba5ac27960d859b1f17d11a3c1cd6a0006704b1410

// Genesis Pool ID
pool_id: 730993554056884283224259059297934576024721456828383733531590831263129347422
```

### 3. **Frontend Constants for Future Use**

```typescript
// Sepolia and Mainnet addresses
export const VESU_SEPOLIA_ADDRESSES = { /* ... */ };
export const VESU_MAINNET_ADDRESSES = { /* ... */ };

// Helper to get contract address
export function getVesuAddress(contract: string): string {
  return CURRENT_NETWORK.addresses[contract];
}
```

---

## 🚀 **How to Use the Integration**

### **Step 1: Compile and Deploy the Contract**

```bash
cd apps/contracts
scarb build

# Deploy to Sepolia
starknet deploy --contract target/dev/btc_vault.sierra.json \
  --inputs [OWNER_ADDRESS] [WBTC_ADDRESS] [POOL_ID] [RBBTC_ADDRESS] \
  --network sepolia
```

### **Step 3: Connect Wallet and Use**

1. **Connect your Starknet wallet** (Argent, Braavos)
2. **View pool metrics** and your position
3. **Deposit WBTC** to start generating yield
4. **Monitor returns** in real-time
5. **Withdraw funds** whenever you want

---

## 📊 **Available Metrics and Data**

### **User Data:**

* Current position (collateral and debt)
* rbBTC token balance
* Transaction history

### **Pool Data:**

* Current lending APY
* Utilization rate
* Total collateral and debt
* Current WBTC price

### **Vault Data:**

* Total deposited
* Accumulated fees
* Status (paused/active)
* Fee configuration

---

## 🔐 **Security Implementations**

### **In the Cairo Contract:**

* ✅ **Access control** (only owner for critical functions)
* ✅ **Emergency pause**
* ✅ **Minimum amount validation**
* ✅ **Fee limits** (max 10%/20%)
* ✅ **Balance checks** before transfers

### **In the Frontend:**

* ✅ **Input validation**
* ✅ **Error handling**
* ✅ **Transaction timeouts**
* ✅ **Wallet connection verification**

---

## 🚧 **Next Steps**

### **1. Additional Features:**

```cairo
// Automatic rebalance function
fn auto_rebalance(ref self: ContractState) -> bool

// Integration with multiple pools
fn add_pool(ref self: ContractState, pool_id: felt252, allocation: u256)

// Rewards system
fn claim_rewards(ref self: ContractState) -> u256
```

### **2. Optimizations:**

* **Dynamic share price calculation** based on accumulated yield
* **Integration with multiple assets** (ETH, USDC, USDT)
* **Automatic rebalance strategies**
* **Governance system** for vault parameters

---

## 🌐 **Resources and Links**

### **Vesu Documentation:**

* [Official Docs](https://docs.vesu.xyz/)
* [Contract Addresses](https://docs.vesu.xyz/dev-guides/contract-addresses)
* [API Reference](https://api.vesu.xyz/)

### **Starknet Resources:**

* [Starknet Docs](https://docs.starknet.io/)
* [Cairo Book](https://book.cairo-lang.org/)
* [Starknet.js](https://starknetjs.com/)

---

## ⚡ **Testing and Deployment**

```bash
# Cairo contract tests
cd apps/contracts
scarb test
```

**Numo Team!**
