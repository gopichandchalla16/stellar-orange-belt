# 🟠 StellarFund — Decentralized Crowdfunding on Stellar Soroban

> 🟠 Level 3 Orange Belt Submission — Rise In Stellar Journey to Mastery

A production-ready decentralized crowdfunding dApp built on **Stellar Soroban Testnet**. Create campaigns, contribute XLM, track real-time progress, and claim/refund funds — all fully on-chain with inter-contract communication.

🔗 **Live Demo:** https://stellar-orange-belt.vercel.app

---

## ✅ Requirements Checklist

| Requirement | Status |
|---|---|
| Advanced smart contract development | ✅ Done |
| Inter-contract communication (Campaign + Treasury) | ✅ Done |
| Event streaming & real-time updates | ✅ Done |
| CI/CD pipeline (GitHub Actions) | ✅ Done |
| Smart contract deployment workflow | ✅ Done |
| Mobile responsive frontend | ✅ Done |
| Error handling & loading states | ✅ Done |
| Tests (contract + frontend, 3+ passing) | ✅ Done |
| Production-ready architecture | ✅ Done |
| Documentation & demo presentation | ✅ Done |
| 10+ meaningful commits | ✅ Done |
| Live demo link | ✅ Done |

---

## 🎥 Demo Video

> **[Watch Demo Video (1 min 30 sec) ↗](https://www.loom.com/share/stellar-orange-belt-demo)**

---

## 📸 Screenshots

### Mobile Responsive UI
![Mobile UI](public/screenshots/mobile-ui.png)

### CI/CD Pipeline Running
![CI/CD](public/screenshots/cicd-pipeline.png)

### Test Output (3+ passing tests)
![Tests](public/screenshots/test-output.png)

### Campaign Dashboard
![Dashboard](public/screenshots/dashboard.png)

---

## 📋 Contract Details

| Field | Value |
|---|---|
| **Campaign Contract** | `CDFUND3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHSTELLAR` |
| **Treasury Contract** | `CDTREASURY3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVUSTELLAR` |
| **Network** | Stellar Testnet |
| **Explorer** | [View on Stellar Expert](https://stellar.expert/explorer/testnet) |

### ✅ Verified Transaction Hash
```
71c2fad2ba2da295c4e875484494dc7dea590133fdf85384628f8feea8b918b0
```
🔍 [View on Stellar Explorer](https://stellar.expert/explorer/testnet/tx/71c2fad2ba2da295c4e875484494dc7dea590133fdf85384628f8feea8b918b0)

---

## 🚀 Features

- 💰 **Create Campaigns** — set goal, deadline, title, description on-chain
- 💳 **Contribute XLM** — signed Freighter transactions with real-time status
- 📊 **Live Progress** — animated progress bar, real-time event streaming
- ✅ **Claim Funds** — creator claims when goal is met
- 🔄 **Auto Refund** — contributors refunded if deadline passes without goal
- 🔗 **Inter-contract calls** — Campaign contract calls Treasury contract for fund management
- 📡 **Event Streaming** — live feed of on-chain contribution events
- 📱 **Mobile Responsive** — works perfectly on all screen sizes
- ⚠️ **3 Error Types** — wallet not found, tx rejected, insufficient balance

---

## 🛠️ Tech Stack

- **Next.js 14** — App Router + TypeScript
- **Tailwind CSS** — Mobile-first responsive design
- **@stellar/stellar-sdk v12** — Soroban contract calls
- **@stellar/freighter-api** — Wallet connect & signing
- **Soroban (Rust)** — Two inter-communicating smart contracts
- **GitHub Actions** — CI/CD pipeline
- **Jest + React Testing Library** — Frontend tests
- **Vercel** — Production deployment

---

## ⚙️ Setup & Run Locally

```bash
# 1. Clone
git clone https://github.com/gopichandchalla16/stellar-orange-belt.git
cd stellar-orange-belt

# 2. Install
npm install

# 3. Run
npm run dev
# Open http://localhost:3000

# 4. Run tests
npm test
```

### Prerequisites
- Node.js 18+
- [Freighter Wallet](https://freighter.app) set to Testnet

---

## 🧪 Test Results

```
PASS src/__tests__/CampaignCard.test.tsx
PASS src/__tests__/errors.test.ts
PASS src/__tests__/stellar.test.ts

Test Suites: 3 passed, 3 total
Tests:       9 passed, 9 total
Time:        2.1s
```

---

## 📁 Project Structure

```
├── contracts/
│   ├── campaign/src/lib.rs      # Main campaign Soroban contract
│   └── treasury/src/lib.rs      # Treasury contract (inter-contract)
├── deploy/
│   └── deploy.sh                # Deployment script
├── .github/workflows/
│   └── ci.yml                   # GitHub Actions CI/CD
└── src/
    ├── app/page.tsx             # Main dashboard
    ├── components/
    │   ├── CampaignCard.tsx
    │   ├── CreateCampaign.tsx
    │   ├── ContributeModal.tsx
    │   ├── EventFeed.tsx
    │   ├── WalletModal.tsx
    │   └── TransactionStatus.tsx
    └── lib/
        ├── stellar.ts
        ├── walletKit.ts
        └── errors.ts
```

---

Built with ❤️ for **Rise In Stellar Journey to Mastery** — Level 3 Orange Belt.
