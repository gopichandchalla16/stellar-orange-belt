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

export type StellarEvent = {
  type: 'contrib' | 'created' | 'claimed';
  campaignId?: number;
  amount?: number;
  from?: string;
  title?: string;
  ts: number;
};

const SEED_EVENTS: StellarEvent[] = [
  { type: 'contrib', campaignId: 2, amount: 500, from: 'GD4X...MNOP', ts: Date.now() - 25000 },
  { type: 'contrib', campaignId: 1, amount: 100, from: 'GB3Z...WAFO', ts: Date.now() - 90000 },
  { type: 'created', campaignId: 3, title: 'DeFi Liquidity Pool', ts: Date.now() - 180000 },
  { type: 'contrib', campaignId: 3, amount: 2000, from: 'GC7K...QRST', ts: Date.now() - 320000 },
  { type: 'claimed', campaignId: 3, from: 'GC7K...QRST', ts: Date.now() - 420000 },
];

export async function fetchEvents(): Promise<StellarEvent[]> {
  return SEED_EVENTS;
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
    throw new Error('Freighter not installed — using demo mode');
  return window.freighter.getPublicKey();
}

export function shortenKey(k: string): string {
  if (!k) return '';
  if (k.length <= 12) return k;
  return k.slice(0, 6) + '...' + k.slice(-4);
}

export function generateDemoTxHash(): string {
  return Array.from({ length: 64 }, () =>
    '0123456789abcdef'[Math.floor(Math.random() * 16)]
  ).join('');
}

export function generateDemoAddress(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  return 'G' + Array.from({ length: 55 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
