# StellarFund — Architecture Deep Dive

This document details the technical architecture of StellarFund for reviewers who want to understand the engineering decisions.

## Smart Contract Design

### Campaign Contract State Machine

```
[CREATED] ──contribute()──→ [ACTIVE] ──goal met + claim()──→ [FUNDED]
    │                           │
    └──deadline passes──→ [EXPIRED] ──refund()──→ [REFUNDED]
```

All state transitions are enforced on-chain. The contract uses Soroban's `Persistent` storage for campaign data and `Temporary` storage for per-contributor balances within a campaign.

### Inter-Contract Communication

The Campaign Contract calls the Treasury Contract using Soroban's cross-contract invocation:

```rust
// In campaign contract contribute() function
let fee = amount / 100; // 1%
let net = amount - fee;

// Cross-contract call
let treasury = TreasuryContractClient::new(&env, &self.treasury_address);
treasury.deposit(&fee, &campaign_id);

// Continue with net contribution to campaign
```

This pattern is **atomically rolled back** if either contract panics — ensuring no partial state.

### Event Streaming Architecture

The frontend polls Stellar Horizon's `/transactions` endpoint for the Campaign Contract account, filtering for `ContractEvents`. Events are deduplicated by `transaction_hash` and displayed in reverse chronological order:

```typescript
// src/lib/stellar.ts
export async function fetchEvents(contractId: string): Promise<ContractEvent[]> {
  const server = new StellarSdk.Horizon.Server(HORIZON_URL);
  const txs = await server.transactions()
    .forAccount(contractId)
    .order('desc')
    .limit(20)
    .call();
  // Parse contract events from transaction records
  return parseContractEvents(txs.records);
}
```

## Frontend State Management

The app uses React's built-in state with custom hooks — no external state library needed at this scale:

- `useWallet` — Freighter connection, public key, XLM balance
- `useCampaigns` — campaign list with loading/error states, auto-refresh on new events
- `useEvents` — 5-second polling loop for Horizon events, auto-deduplication

## Error Handling Strategy

Errors are classified into three tiers:

1. **User errors** (e.g., wallet not connected, invalid amount) → inline validation, no banner
2. **Transaction errors** (e.g., user rejected, insufficient balance) → `TransactionStatus` component, auto-dismiss after 5s
3. **Network errors** (e.g., Horizon unreachable) → persistent error banner, retry button

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
jobs:
  ci:
    steps:
      - npm install
      - npm run lint        # ESLint — fail on warnings
      - npm test            # Jest — fail on any test failure
      - npm run build       # Next.js build — fail on type errors
```

Vercel is connected via GitHub integration — on every successful push to `main`, Vercel auto-deploys. The Vercel deployment is blocked if CI fails (via branch protection rules).
