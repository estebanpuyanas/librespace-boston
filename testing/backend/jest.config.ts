import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/**/*.spec.ts'],
  moduleNameMapper: {
    '^shared/(.*)$': '<rootDir>/../../shared/$1',
    '^@server/(.*)$': '<rootDir>/../../server/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['../../server/src/**/*.ts', '!../../server/src/server.ts'],
};

export default config;
