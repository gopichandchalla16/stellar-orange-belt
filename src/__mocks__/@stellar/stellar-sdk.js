module.exports = {
  Horizon: {
    Server: jest.fn().mockImplementation(() => ({
      loadAccount: jest.fn(),
      submitTransaction: jest.fn(),
    })),
  },
  TransactionBuilder: jest.fn(),
  BASE_FEE: '100',
  Operation: { payment: jest.fn() },
  Asset: { native: jest.fn() },
  Memo: { text: jest.fn() },
  Networks: { TESTNET: 'Test SDF Network ; September 2015' },
};
