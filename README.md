# ⭐ StellarFund — Decentralized Crowdfunding on Soroban

> **Level 3 Orange Belt Submission** — Soroban Smart Contracts Track

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://stellar-orange-belt.vercel.app)
[![Contract](https://img.shields.io/badge/Contract-Soroban%20Testnet-orange?style=for-the-badge&logo=stellar)](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3B)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

---

## 🚀 What is StellarFund?

StellarFund is a **fully decentralized crowdfunding platform** built on the Stellar Soroban smart contract network. Backers fund campaigns with **real XLM**, every transaction is recorded on-chain, and campaign progress is governed by Soroban contracts — no centralized intermediary.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🏗️ **Soroban Smart Contract** | Deployed on Stellar Testnet — all campaign logic lives on-chain |
| 💰 **XLM Contributions** | Fund campaigns with real XLM via Freighter wallet |
| 🎮 **Demo Mode** | Full access without a wallet — 10,000 XLM test tokens |
| 🏁 **Milestone Voting** | Backers vote on campaign milestones on-chain |
| 📊 **Analytics Dashboard** | Live charts: raised vs goal, backers distribution, funding velocity |
| 🏆 **Contributor Leaderboard** | Live-updating top backer rankings |
| 💹 **Live XLM Price Feed** | Real-time XLM/USD from CoinGecko API |
| 👛 **Wallet History** | Real Horizon API transaction history for connected wallets |
| 📡 **Live Event Feed** | Real-time on-chain event streaming |
| 🔍 **Category Filter + Sort** | Filter by Education/DeFi/Dev Tools, sort by raised/% funded/deadline |

---

## 🏗️ Architecture

```
StellarFund
├── Frontend: Next.js 15 + TypeScript
├── Styling: Custom CSS (glassmorphism, animations)
├── Blockchain: Stellar Soroban Testnet
│   └── Contract: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3B
├── Wallet: Freighter Browser Extension
├── Data APIs:
│   ├── Horizon Testnet (balances, transactions)
│   └── CoinGecko (XLM live price)
└── Deployment: Vercel (auto-deploy on push)
```

---

## 🔗 Smart Contract

- **Contract ID:** `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3B`
- **Network:** Stellar Testnet
- **Explorer:** [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3B)
- **Soroban Version:** v21

The Soroban contract handles:
- Campaign creation with goals and deadlines
- XLM contribution tracking per backer
- Milestone state management
- Fund claiming when goal is reached

---

## 🛠️ Local Development

```bash
git clone https://github.com/gopichandchalla16/stellar-orange-belt
cd stellar-orange-belt
npm install
npm run dev
# Open http://localhost:3000
```

### Environment
- Node.js 18+
- No environment variables needed — testnet is public

---

## 🎮 How to Use

### Option A: Demo Mode (No wallet needed)
1. Click **"▶ Launch Demo Mode"**
2. You get 10,000 XLM test tokens
3. Fund campaigns, vote on milestones, create campaigns — all features unlocked

### Option B: Freighter Wallet
1. Install [Freighter](https://freighter.app)
2. Switch to **Testnet** in Freighter settings
3. Fund your account via [Friendbot](https://friendbot.stellar.org)
4. Click **"🔑 Connect Wallet"** on StellarFund
5. Fund campaigns with real testnet XLM

---

## 📊 Campaign Features

Each campaign includes:
- **Progress bar** with on-chain milestone markers
- **Milestone voting** — backers vote on creator milestones to verify progress
- **Backer count** and live USD value (via XLM price feed)
- **Category tags** and **#hashtag filtering**
- **Deadline tracking** with days remaining

---

## 🏆 Tech Stack

- **Next.js 15** (App Router, Server Components)
- **TypeScript** (strict mode)
- **Stellar Soroban** (smart contracts)
- **Stellar Horizon API** (account balances, payment history)
- **Freighter SDK** (wallet connection)
- **CoinGecko API** (live XLM price)
- **Vercel** (deployment + CDN)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main app — campaigns, analytics, leaderboard, wallet
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Design system (glassmorphism)
├── components/
│   ├── CreateCampaign.tsx  # Campaign creation modal
│   └── ContributeModal.tsx # Funding modal with XLM input
└── lib/
    └── stellar.ts        # Horizon API, XLM price, wallet utils
```

---

*Built with ❤️ for the Stellar Developer Community · Orange Belt Level 3*
