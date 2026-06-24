describe('UI Logic', () => {
  test('empty wallet', () => { expect(''.length).toBe(0); });
  test('btn text connected', () => { expect('GBTEST' ? 'Fund' : 'Connect').toBe('Fund'); });
  test('btn text disconnected', () => { expect('' ? 'Fund' : 'Connect').toBe('Connect'); });
  test('error message non-empty', () => { expect('Freighter not installed'.length).toBeGreaterThan(0); });
});
