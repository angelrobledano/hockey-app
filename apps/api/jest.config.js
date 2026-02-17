module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  moduleNameMapper: {
    '^@hockey/shared$': '<rootDir>/../../packages/shared/src'
  }
};
