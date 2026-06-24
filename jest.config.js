module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.(ts|tsx)$': ['ts-jest',{tsconfig:{jsx:'react'}}] },
  testMatch: ['<rootDir>/src/__tests__/**/*.{ts,tsx}'],
  passWithNoTests: true,
};
