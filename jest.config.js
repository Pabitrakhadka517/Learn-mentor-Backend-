module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: [
        '**/tests/**/*.test.ts',
        '**/src/**/*.test.ts'
    ],
    transform: {
        '^.+\\.(ts|js)$': 'ts-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(uuid)/)'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
};
