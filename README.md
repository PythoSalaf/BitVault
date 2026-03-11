# BitVault — Bitcoin Yield Vaults on Starknet

BitVault is a decentralized Bitcoin yield vault platform that allows users to earn sustainable yield on BTC through automated DeFi strategies built on Starknet.  
The protocol follows ERC-4626 vault standards and provides transparent, secure, and programmable yield strategies with an AI-powered assistant for portfolio guidance.

Live Demo: https://bit-vault-eta.vercel.app/  
Repository: https://github.com/PythoSalaf/BitVault

---

## Overview

BitVault enables users to deposit Bitcoin-backed assets into smart vaults that automatically execute yield strategies on Starknet.

The platform focuses on:

- Secure vault architecture
- Transparent on-chain strategies
- AI-assisted decision making
- ERC-4626 compliant vault design
- Starknet smart contracts written in Cairo

The goal is to make Bitcoin productive in DeFi without sacrificing security.

---

## Features

### Bitcoin Yield Vaults

- Deposit BTC-backed assets
- Earn automated yield
- ERC-4626 vault standard
- Transparent vault logic

### BitVault Intelligence (AI Agent)

Built-in AI assistant that can:

- Show live vault data
- Compare vault tiers
- Suggest best yield strategy
- Analyze user portfolio
- Explain how yield works
- Guide deposits

Example prompts:

- Vault status
- My portfolio
- Compare tiers
- Deposit now
- Best tier for me
- How does yield work?

### Starknet Smart Contracts

- Written in Cairo
- Designed for scalability
- Secure vault execution
- L2 low-fee transactions

### Frontend Dashboard

- Built with React + Vite + TypeScript
- Tailwind UI
- Wallet interaction
- Vault analytics
- Strategy overview

---

## Tech Stack

Frontend

- React
- TypeScript
- Vite
- TailwindCSS

Web3

- viem
- starknet.js
- ERC-4626 vault standard

Smart Contracts

- Cairo
- Starknet

State / Hooks / Context

- React Context
- Custom Hooks

AI Agent

- Client-side AI interaction UI
- Strategy assistant interface

---

## Project Structure
src/
├ assets/
├ components/
├ context/
├ contracts/
├ hooks/
├ lib/
├ pages/
├ App.tsx
├ main.tsx


---

## Installation

Clone the repo
git clone https://github.com/PythoSalaf/BitVault.git


Install dependencies
npm install


---

## How It Works

1. User connects wallet
2. Select vault tier
3. Deposit BTC-backed asset
4. Smart contract executes strategy
5. Yield generated automatically
6. User tracks performance in dashboard
7. AI agent suggests optimizations

---

## Vault Architecture

- ERC-4626 vault interface
- Strategy contract
- Asset manager
- Yield executor
- Starknet L2 execution

Designed for:

- Security
- Transparency
- Composability
- Automation

---

## Use Cases

- Passive BTC yield
- DeFi strategy automation
- Portfolio management
- Starknet DeFi experimentation
- Hackathon / grant / research projects

---

## Future Plans

- Live on-chain vault execution
- Real AI strategy engine
- Multi-vault support
- Cross-chain deposits
- Advanced analytics
- DAO governance
- Risk scoring system

---

## License

MIT License
