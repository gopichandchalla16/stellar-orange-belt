'use client';

export interface WalletOption {
  id: string;
  name: string;
  icon: string;
  desc: string;
  installUrl: string;
}

export const SUPPORTED_WALLETS: WalletOption[] = [
  { id: 'freighter', name: 'Freighter', icon: '🟣', desc: 'Official Stellar browser wallet', installUrl: 'https://freighter.app' },
  { id: 'xbull', name: 'xBull Wallet', icon: '🐂', desc: 'Feature-rich Stellar wallet', installUrl: 'https://xbull.app' },
  { id: 'hana', name: 'Hana Wallet', icon: '🌸', desc: 'Multi-chain wallet with Stellar', installUrl: 'https://hana.finance' },
  { id: 'lobstr', name: 'Lobstr', icon: '🦞', desc: 'Simple & secure Stellar wallet', installUrl: 'https://lobstr.co' },
  { id: 'rabet', name: 'Rabet', icon: '🔮', desc: 'Browser extension for Stellar', installUrl: 'https://rabet.io' },
];

export async function connectFreighter(): Promise<string> {
  const freighter = await import('@stellar/freighter-api');
  const connected = await freighter.isConnected();
  if (!connected || !(connected as unknown as { isConnected: boolean }).isConnected) {
    throw new Error('WALLET_NOT_FOUND: Freighter not installed');
  }
  const result = await freighter.requestAccess();
  const address = typeof result === 'string' ? result : (result as unknown as { address: string }).address;
  if (!address) throw new Error('WALLET_REJECTED: Access denied by user');
  return address;
}

export async function signTxFreighter(xdr: string, networkPassphrase: string): Promise<string> {
  const freighter = await import('@stellar/freighter-api');
  const result = await freighter.signTransaction(xdr, { networkPassphrase });
  const signed = typeof result === 'string' ? result : (result as unknown as { signedTxXdr: string }).signedTxXdr;
  if (!signed) throw new Error('WALLET_REJECTED: Transaction signing rejected by user');
  return signed;
}
