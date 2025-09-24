module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: './tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@services/(.*)$': '<rootDir>/src/app/services/$1',
    '^@components/(.*)$': '<rootDir>/src/app/components/$1',
    '^@models/(.*)$': '<rootDir>/src/app/models/$1'
  },
  testMatch: ['**/tests/**/*.spec.ts', '**/+(*.)+(spec|test).+(ts|js)?(x)'],
  collectCoverage: true,
  coverageReporters: ['html', 'lcov'],
  coverageDirectory: 'coverage',
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|@angular|@ngrx)'
  ]
};