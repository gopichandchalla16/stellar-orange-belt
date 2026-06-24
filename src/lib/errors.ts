export interface WalletError {
  type: 'not_found' | 'rejected' | 'insufficient' | 'unknown';
  message: string;
  hint: string;
}

export function parseWalletError(error: unknown): WalletError {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (msg.includes('not_found') || msg.includes('not installed') || msg.includes('not found')) {
    return { type: 'not_found', message: 'Wallet Not Found', hint: 'Please install Freighter wallet extension to continue.' };
  }
  if (msg.includes('rejected') || msg.includes('denied') || msg.includes('declined') || msg.includes('cancel')) {
    return { type: 'rejected', message: 'Transaction Rejected', hint: 'You rejected the transaction in your wallet. Click to try again.' };
  }
  if (msg.includes('insufficient') || msg.includes('balance') || msg.includes('op_underfunded')) {
    return { type: 'insufficient', message: 'Insufficient XLM Balance', hint: 'Your wallet does not have enough XLM. Fund it via Stellar Friendbot.' };
  }
  return { type: 'unknown', message: 'Something Went Wrong', hint: msg || 'An unexpected error occurred. Please try again.' };
}
