/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

export default {
  // Use ts-jest preset for ESM support
  preset: "ts-jest/presets/default-esm",

  // Enable ESM support
  extensionsToTreatAsEsm: [".ts"],

  // Test environment
  testEnvironment: "node",

  // Coverage settings
  coverageDirectory: "coverage",
  coverageProvider: "v8",

  // Module resolution
  moduleDirectories: [
    "<rootDir>/src",
    "node_modules"
  ],

  moduleFileExtensions: [
    "js",
    "mjs",
    "ts",
    "mts",
    "json",
    "node"
  ],

  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
    // Map .js extensions to .ts files for ESM imports
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  // Test patterns - only look in the test/ folder
  testMatch: [
    "<rootDir>/test/**/*.[jt]s?(x)",
    "<rootDir>/test/**/?(*.)+(spec|test).[tj]s?(x)"
  ],

  // Setup
  setupFiles: ['dotenv/config'],

  // Transform configuration for ESM - new format
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      useESM: true,
      tsconfig: {
        module: "ESNext"
      }
    }]
  },

  // Transform patterns
  transformIgnorePatterns: [
    "/node_modules/(?!(n-gram|@escape-string-regexp|lodash)/)"
  ],
};
