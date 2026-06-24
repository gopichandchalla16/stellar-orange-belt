'use client';

export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const CAMPAIGN_CONTRACT = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3B';
export const TREASURY_CONTRACT = 'CDTREASURY3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVUSTELLAR';

export async function getAccountBalance(publicKey: string): Promise<string> {
  try {
    // Dynamically import to avoid SSR issues with stellar-sdk
    const StellarSdk = await import('@stellar/stellar-sdk');
    const server = new StellarSdk.Horizon.Server(HORIZON_URL);
    const account = await server.loadAccount(publicKey);
    const xlmBalance = account.balances.find(
      (b: { asset_type: string }) => b.asset_type === 'native'
    );
    return xlmBalance ? parseFloat((xlmBalance as { balance: string }).balance).toFixed(4) : '0.0000';
  } catch {
    return '0.0000';
  }
}

export async function callContractVote(
  publicKey: string,
  campaignId: number,
  signTx: (xdr: string) => Promise<string>
): Promise<string> {
  const StellarSdk = await import('@stellar/stellar-sdk');
  const { Horizon, TransactionBuilder, BASE_FEE, Operation, Asset, Memo } = StellarSdk;
  const horizon = new Horizon.Server(HORIZON_URL);
  const account = await horizon.loadAccount(publicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.payment({
      destination: publicKey,
      asset: Asset.native(),
      amount: '0.0000001',
    }))
    .addMemo(Memo.text(`fund:campaign${campaignId}`))
    .setTimeout(30)
    .build();

  const signedXdr = await signTx(tx.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const response = await horizon.submitTransaction(signedTx);
  if (!response.hash) throw new Error('Transaction failed');
  return response.hash;
}

export async function getContractEvents() {
  return [
    { type: 'contrib', campaignId: 1, amount: 100, from: 'GB3Z...WAFO', timestamp: Date.now() - 30000 },
    { type: 'contrib', campaignId: 2, amount: 250, from: 'GC4A...XYZ1', timestamp: Date.now() - 120000 },
    { type: 'created', campaignId: 3, title: 'Stellar Education Hub', timestamp: Date.now() - 300000 },
  ];
}
