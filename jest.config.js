module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    'node-fetch': 'jest-fetch-mock',
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
};
