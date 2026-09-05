/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/fixtures/'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/cli/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
