# Numo - Cairo Smart Contracts

This directory contains the Cairo smart contracts that manage payment logic, APIs, and yield strategies on Starknet.

## 📁 Structure

```
contracts/
├── src/
│   ├── payment_gateway.cairo    # Main payment gateway contract
│   ├── api_endpoint.cairo       # API endpoint management contract
│   ├── strategies/             # Yield strategies and vaults
│   │   ├── ekubo.cairo        # Ekubo liquidity provision strategy
│   │   └── vesu.cairo         # Vesu lending strategy
│   └── interfaces/            # Shared interfaces and types
├── tests/                     # Contract tests
├── Scarb.toml                # Scarb configuration
├── snfoundry.toml            # StarkNet development and testing tool
└── README.md                 # This file
```

## 🎯 Main Contracts

### Payment Gateway (`payment_gateway.cairo`)
- Manages payment and transfer logic
- Validates wallet addresses
- Handles different token types (STRK, ERC20, WBTC)
- Integration with multiple yield strategies

### API Endpoint (`api_endpoint.cairo`)
- Generates and manages unique endpoints
- Stores API configurations
- Handles permission validation
- External service integration

### Yield Strategies
- **Ekubo Strategy**: BTC/USDC pool liquidity provision
- **Vesu Strategy**: BTC lending and borrowing
- Position auto-rebalancing
- Automatic fee conversion to WBTC

## 🛠 Development

### Prerequisites

- [Scarb](https://docs.swmansion.com/scarb/) - Cairo package manager
- [Starknet CLI](https://docs.starknet.io/documentation/tools/cli/) - Development tools
- [Foundry](https://book.getfoundry.sh/) - Testing framework

### Build

```bash
scarb build
```

### Tests

```bash
scarb test
```

### Deployment

```bash
starknet deploy --contract target/dev/numo_payment_gateway.sierra.json
```

## 🔒 Security

- Comprehensive input validation
- Secure token and balance management
- Reentrancy protection
- Permission and role verification
- Regular security audits
- Event and log monitoring
- Emergency pause system

## 📊 Metrics and Monitoring

- Real-time APY tracking
- TVL monitoring per strategy
- Performance and gas metrics
- Security alerts

## 🤝 Integrations

- **Ekubo**: AMM and liquidity pools
- **Vesu**: Lending protocol
- **Starknet**: Base infrastructure
- **WBTC**: Primary token

## 📝 Documentation

For more details about contract implementation and usage, check the [technical documentation](./docs/).

---

Developed with ❤️ by the Numo Team 