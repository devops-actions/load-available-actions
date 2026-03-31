module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!@actions)'
  ],
  verbose: true
}