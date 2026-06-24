/**
 * Stellar utility function tests
 */

function formatXLM(raw: string | number): string {
  const num = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (isNaN(num)) return '0.0000';
  return num.toFixed(4);
}

function shortenKey(key: string): string {
  if (!key || key.length < 10) return key || '';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function isValidStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address);
}

function xlmToStroops(xlm: number): number {
  return Math.round(xlm * 10_000_000);
}

function stroopsToXlm(stroops: number): number {
  return stroops / 10_000_000;
}

describe('Stellar Utilities', () => {
  test('formats XLM balance to 4 decimal places', () => {
    expect(formatXLM('9999.12345')).toBe('9999.1235');
    expect(formatXLM(100)).toBe('100.0000');
    expect(formatXLM(0)).toBe('0.0000');
  });

  test('returns 0.0000 on invalid balance', () => {
    expect(formatXLM('not-a-number')).toBe('0.0000');
    expect(formatXLM(NaN)).toBe('0.0000');
  });

  test('shortens Stellar public key correctly', () => {
    const key = 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37';
    expect(shortenKey(key)).toBe('GDQP...W37');
    expect(shortenKey('')).toBe('');
  });

  test('validates Stellar G-address format', () => {
    expect(isValidStellarAddress('GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37')).toBe(true);
    expect(isValidStellarAddress('BADADDRESS')).toBe(false);
    expect(isValidStellarAddress('')).toBe(false);
  });

  test('converts XLM to stroops correctly', () => {
    expect(xlmToStroops(1)).toBe(10_000_000);
    expect(xlmToStroops(100)).toBe(1_000_000_000);
    expect(xlmToStroops(0.5)).toBe(5_000_000);
  });

  test('converts stroops back to XLM correctly', () => {
    expect(stroopsToXlm(10_000_000)).toBe(1);
    expect(stroopsToXlm(5_000_000)).toBe(0.5);
  });
});
