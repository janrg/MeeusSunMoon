module.exports = {
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
    preset: 'ts-jest',
    setupFilesAfterEnv: ['jest-sorted'],
    testEnvironment: 'node',
    testMatch: ['**/test/tests.ts'],
    transform: {
        '\\.(ts)$': 'ts-jest',
        '^.+\\.js$': 'babel-jest',
    },
};
