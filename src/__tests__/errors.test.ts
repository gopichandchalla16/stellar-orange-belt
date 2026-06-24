/**
 * Error handling tests — classifies Freighter and network errors correctly
 */

type ErrorType = 'freighter_not_installed' | 'user_rejected' | 'network_error' | 'unknown';

function classifyError(message: string): ErrorType {
  if (message.includes('Freighter') || message.includes('not installed')) {
    return 'freighter_not_installed';
  }
  if (message.includes('User declined') || message.includes('rejected') || message.includes('cancelled')) {
    return 'user_rejected';
  }
  if (message.includes('timeout') || message.includes('network') || message.includes('ECONNREFUSED')) {
    return 'network_error';
  }
  return 'unknown';
}

function formatErrorMessage(type: ErrorType): string {
  switch (type) {
    case 'freighter_not_installed':
      return 'Please install the Freighter wallet extension to continue.';
    case 'user_rejected':
      return 'Transaction was cancelled. No funds were moved.';
    case 'network_error':
      return 'Network error. Please check your connection and try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

describe('Error Handling', () => {
  test('classifies Freighter not installed error', () => {
    const type = classifyError('Freighter extension not installed');
    expect(type).toBe('freighter_not_installed');
    expect(formatErrorMessage(type)).toContain('install the Freighter');
  });

  test('classifies user rejection error', () => {
    const type = classifyError('User declined to sign the transaction');
    expect(type).toBe('user_rejected');
    expect(formatErrorMessage(type)).toContain('cancelled');
  });

  test('classifies network timeout error', () => {
    const type = classifyError('Request timeout — network unavailable');
    expect(type).toBe('network_error');
    expect(formatErrorMessage(type)).toContain('Network error');
  });

  test('returns unknown for unrecognized errors', () => {
    const type = classifyError('Some completely unexpected error string');
    expect(type).toBe('unknown');
    expect(formatErrorMessage(type)).toContain('unexpected error');
  });

  test('user rejected via cancelled keyword', () => {
    const type = classifyError('Transaction cancelled by user');
    expect(type).toBe('user_rejected');
  });
});
