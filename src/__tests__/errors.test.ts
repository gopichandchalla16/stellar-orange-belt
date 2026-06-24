import { parseWalletError } from '../lib/errors';

describe('parseWalletError', () => {
  test('returns not_found for wallet not installed error', () => {
    const result = parseWalletError(new Error('WALLET_NOT_FOUND: not installed'));
    expect(result.type).toBe('not_found');
    expect(result.message).toBe('Wallet Not Found');
  });

  test('returns rejected for user denial error', () => {
    const result = parseWalletError(new Error('WALLET_REJECTED: user declined'));
    expect(result.type).toBe('rejected');
    expect(result.message).toBe('Transaction Rejected');
  });

  test('returns insufficient for balance error', () => {
    const result = parseWalletError(new Error('op_underfunded insufficient balance'));
    expect(result.type).toBe('insufficient');
    expect(result.message).toBe('Insufficient XLM Balance');
  });

  test('returns unknown for unrecognized errors', () => {
    const result = parseWalletError(new Error('something weird happened'));
    expect(result.type).toBe('unknown');
  });

  test('handles non-Error objects gracefully', () => {
    const result = parseWalletError('some string error');
    expect(result.type).toBe('unknown');
  });

  test('hint is always a non-empty string', () => {
    const result = parseWalletError(new Error('random error'));
    expect(typeof result.hint).toBe('string');
    expect(result.hint.length).toBeGreaterThan(0);
  });
});
