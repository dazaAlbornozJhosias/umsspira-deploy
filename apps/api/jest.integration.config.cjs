module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.integration.spec.ts'],
  setupFiles: [],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.check.json' }] },
  modulePathIgnorePatterns: ['<rootDir>/dist'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
