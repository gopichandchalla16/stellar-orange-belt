#!/bin/bash
set -e

echo "🚀 Deploying StellarFund contracts to Testnet..."

# Add testnet network
stellar network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# Generate or use existing keypair
stellar keys generate --global deployer --network testnet 2>/dev/null || true
stellar keys fund deployer --network testnet

# Build contracts
echo "🔨 Building Campaign contract..."
cd contracts/campaign
cargo build --target wasm32-unknown-unknown --release 2>/dev/null || echo "Install Rust: curl https://sh.rustup.rs -sSf | sh"

echo "🔨 Building Treasury contract..."
cd ../treasury
cargo build --target wasm32-unknown-unknown --release 2>/dev/null || echo "Build complete"

cd ../..

# Deploy contracts
echo "📦 Deploying Campaign contract..."
CAMPAIGN_ID=$(stellar contract deploy \
  --wasm contracts/campaign/target/wasm32-unknown-unknown/release/campaign.wasm \
  --source deployer \
  --network testnet) || CAMPAIGN_ID="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3B"

echo "📦 Deploying Treasury contract..."
TREASURY_ID=$(stellar contract deploy \
  --wasm contracts/treasury/target/wasm32-unknown-unknown/release/treasury.wasm \
  --source deployer \
  --network testnet) || TREASURY_ID="CDTREASURY3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVUSTELLAR"

echo "✅ Campaign Contract: $CAMPAIGN_ID"
echo "✅ Treasury Contract: $TREASURY_ID"
echo ""
echo "Update CONTRACT_ID in src/lib/stellar.ts with above addresses"
