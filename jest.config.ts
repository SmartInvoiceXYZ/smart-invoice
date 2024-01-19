import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './packages/dapp',
});

const config: Config = {
  coverageProvider: 'v8',
  projects: [
    {
      preset: 'ts-jest',
      rootDir: './packages/dapp',
      setupFilesAfterEnv: ['<rootDir>/test/setupTests.ts'],
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/test/**/*.test.(ts|tsx|js|jsx)'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.test.json',
          },
        ],
      },
      transformIgnorePatterns: ['node_modules/(?!(viem|isows)/)'],
    },
  ],
  verbose: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
