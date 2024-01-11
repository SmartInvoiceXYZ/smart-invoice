import type {Config} from 'jest';
import nextJest from 'next/jest.js'
 
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

const esModules = ['isows'].join('|');

const config: Config = {
    coverageProvider: 'v8',
    preset: "ts-jest",
    rootDir: ".",
    setupFilesAfterEnv: ["<rootDir>/test/setupTests.ts"],
    testEnvironment: 'jsdom',
    testMatch: ["<rootDir>/test/**/*.test.(ts|tsx)"],
    transform: {
        [`(${esModules}).+\.js$`]: "babel-jest",
        "^.+\.(ts|tsx)$": [
            "ts-jest", {
                tsconfig: "<rootDir>/tsconfig.test.json"
            }
        ],
    },
    transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
    verbose: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);