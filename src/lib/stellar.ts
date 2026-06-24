export const HORIZON = 'https://horizon-testnet.stellar.org';
export const NETWORK = 'Test SDF Network ; September 2015';
export const CAMPAIGN_CONTRACT = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3B';

export async function getBalance(pub: string): Promise<string> {
  try {
    const r = await fetch(`${HORIZON}/accounts/${pub}`);
    if (!r.ok) return '0.0000';
    const d = await r.json();
    const b = d.balances?.find((x: { asset_type: string }) => x.asset_type === 'native');
    return b ? parseFloat(b.balance).toFixed(4) : '0.0000';
  } catch {
    return '0.0000';
  }
}

export async function fetchEvents() {
  return [
    { type: 'contrib', campaignId: 1, amount: 100, from: 'GB3Z...WAFO', ts: Date.now() - 30000 },
    { type: 'contrib', campaignId: 2, amount: 250, from: 'GC4A...XYZ1', ts: Date.now() - 120000 },
    { type: 'created', campaignId: 3, title: 'Stellar Education Hub', ts: Date.now() - 300000 },
  ];
}

declare global {
  interface Window {
    freighter?: {
      isConnected(): Promise<boolean>;
      getPublicKey(): Promise<string>;
      signTransaction(xdr: string, opts: { network: string }): Promise<string>;
    };
  }
}

export async function isFreighterInstalled(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  return typeof window.freighter !== 'undefined';
}

export async function connectWallet(): Promise<string> {
  if (typeof window === 'undefined' || !window.freighter)
    throw new Error('Freighter wallet not installed. Please install it from freighter.app');
  return window.freighter.getPublicKey();
}

export function shortenKey(k: string): string {
  return k.slice(0, 6) + '...' + k.slice(-4);
}
