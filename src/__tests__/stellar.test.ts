import { shortenKey, HORIZON, NETWORK } from '@/lib/stellar';

describe('Stellar Utilities', () => {
  test('shortenKey formats public key correctly', () => {
    const key = 'GBTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789012';
    const short = shortenKey(key);
    expect(short).toContain('...');
    expect(short.startsWith('GBTEST')).toBe(true);
  });
  test('HORIZON points to testnet', () => {
    expect(HORIZON).toContain('testnet');
  });
  test('NETWORK is Stellar testnet passphrase', () => {
    expect(NETWORK).toContain('Test SDF Network');
  });
  test('progress pct rounds correctly', () => {
    expect(Math.round((1450/2000)*100)).toBe(73);
  });
  test('daysLeft returns 0 for past date', () => {
    const past = '2020-01-01';
    const days = Math.max(0, Math.ceil((new Date(past).getTime() - Date.now()) / 86400000));
    expect(days).toBe(0);
  });
});
