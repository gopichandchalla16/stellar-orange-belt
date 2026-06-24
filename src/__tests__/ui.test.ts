/**
 * UI state validation tests
 */

function validateContributeAmount(amount: string): string | null {
  const num = parseFloat(amount);
  if (!amount || amount.trim() === '') return 'Amount is required';
  if (isNaN(num)) return 'Amount must be a number';
  if (num <= 0) return 'Amount must be greater than zero';
  if (num < 1) return 'Minimum contribution is 1 XLM';
  if (num > 100_000) return 'Maximum single contribution is 100,000 XLM';
  return null;
}

function formatTxStatus(status: string): { label: string; color: string } {
  switch (status) {
    case 'pending': return { label: 'Transaction pending…', color: 'yellow' };
    case 'success': return { label: 'Transaction confirmed ✓', color: 'green' };
    case 'error': return { label: 'Transaction failed', color: 'red' };
    default: return { label: '', color: 'gray' };
  }
}

describe('UI State Validation', () => {
  test('validates contribute amount is positive number', () => {
    expect(validateContributeAmount('50')).toBeNull();
    expect(validateContributeAmount('0')).toBe('Amount must be greater than zero');
    expect(validateContributeAmount('-10')).toBe('Amount must be greater than zero');
    expect(validateContributeAmount('')).toBe('Amount is required');
    expect(validateContributeAmount('abc')).toBe('Amount must be a number');
  });

  test('enforces minimum contribution of 1 XLM', () => {
    expect(validateContributeAmount('0.5')).toBe('Minimum contribution is 1 XLM');
    expect(validateContributeAmount('1')).toBeNull();
  });

  test('enforces maximum contribution cap', () => {
    expect(validateContributeAmount('200000')).toBe('Maximum single contribution is 100,000 XLM');
    expect(validateContributeAmount('99999')).toBeNull();
  });

  test('formats transaction status correctly', () => {
    expect(formatTxStatus('pending').label).toBe('Transaction pending…');
    expect(formatTxStatus('success').color).toBe('green');
    expect(formatTxStatus('error').color).toBe('red');
    expect(formatTxStatus('idle').label).toBe('');
  });
});
