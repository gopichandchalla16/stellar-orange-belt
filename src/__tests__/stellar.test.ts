// Unit tests for stellar utility functions

describe('Stellar Constants', () => {
  test('NETWORK_PASSPHRASE is correct for testnet', async () => {
    const { NETWORK_PASSPHRASE } = await import('../lib/stellar');
    expect(NETWORK_PASSPHRASE).toBe('Test SDF Network ; September 2015');
  });

  test('HORIZON_URL is the testnet Horizon server', async () => {
    const { HORIZON_URL } = await import('../lib/stellar');
    expect(HORIZON_URL).toBe('https://horizon-testnet.stellar.org');
  });

  test('CAMPAIGN_CONTRACT is a valid-looking Stellar address', async () => {
    const { CAMPAIGN_CONTRACT } = await import('../lib/stellar');
    expect(CAMPAIGN_CONTRACT).toMatch(/^C/);
    expect(CAMPAIGN_CONTRACT.length).toBeGreaterThan(10);
  });
});
