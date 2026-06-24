module.exports = {
  isConnected: jest.fn().mockResolvedValue({ isConnected: true }),
  requestAccess: jest.fn().mockResolvedValue({ address: 'GBTEST123456789ABCDEF' }),
  signTransaction: jest.fn().mockResolvedValue({ signedTxXdr: 'mock_signed_xdr' }),
  getPublicKey: jest.fn().mockResolvedValue('GBTEST123456789ABCDEF'),
};
