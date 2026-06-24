/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        skipLibCheck: true,
        strict: false,
      },
    }],
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|sass|scss)$': '<rootDir>/src/__mocks__/styleMock.js',
  },
  setupFilesAfterFramework: ['<rootDir>/jest.setup.js'],
  passWithNoTests: true,
  forceExit: true,
  testTimeout: 15000,
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
};

module.exports = config;
