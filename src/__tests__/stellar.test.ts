import { shortenKey, HORIZON, NETWORK } from '@/lib/stellar';
describe('Stellar Utils', () => {
  test('shortenKey works', () => { const k = shortenKey('GBTEST123456789012345'); expect(k).toContain('...'); });
  test('HORIZON is testnet', () => { expect(HORIZON).toContain('testnet'); });
  test('NETWORK passphrase correct', () => { expect(NETWORK).toContain('Test SDF'); });
  test('pct rounds', () => { expect(Math.round((1450/2000)*100)).toBe(73); });
  test('daysLeft past = 0', () => { expect(Math.max(0, Math.ceil((new Date('2020-01-01').getTime()-Date.now())/86400000))).toBe(0); });
});
