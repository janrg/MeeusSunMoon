module.exports = {
    collectCoverage: true,
    coverageDirectory: 'coverage',
    preset: 'ts-jest',
    setupFilesAfterEnv: ['jest-sorted'],
    testEnvironment: 'node',
    testMatch: ['**/test/tests.ts'],
    transform: {
        '\\.(ts)$': 'ts-jest',
        '^.+\\.js$': 'babel-jest',
    },
};
