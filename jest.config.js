/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/**/*.test.(js|jsx|ts|tsx)"],
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Report test results in a more verbose format
  verbose: true,
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/node_modules/**",
    "!**/vendor/**"
  ]

};