const { argv } = require('yargs');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '<rootDir>/src/**/*.js'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['html', 'lcov'].concat(argv.coverage ? ['text'] : []),
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/', '/e2e/'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  reporters: ['default', ['jest-ctrf-json-reporter', {}]],
};
