module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '\\.integration\\.spec\\.ts$'],
  setupFiles: ['<rootDir>/test/setup.ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.check.json' }] },
  modulePathIgnorePatterns: ['<rootDir>/dist'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
