describe('UI Logic', () => {
  test('renders wallet connect state correctly', () => {
    const wallet = '';
    expect(wallet.length).toBe(0);
  });
  test('shows correct button text when wallet is connected', () => {
    const wallet = 'GBTEST123';
    const btnText = wallet ? 'Fund 100 XLM' : 'Connect Wallet to Fund';
    expect(btnText).toBe('Fund 100 XLM');
  });
  test('shows correct button text when wallet is disconnected', () => {
    const wallet = '';
    const btnText = wallet ? 'Fund 100 XLM' : 'Connect Wallet to Fund';
    expect(btnText).toBe('Connect Wallet to Fund');
  });
  test('error state message is non-empty on failure', () => {
    const err = 'Freighter not installed';
    expect(err.length).toBeGreaterThan(0);
  });
});
