module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/tests/**/*.test.ts'],
    setupFiles: ['<rootDir>/tests/setup.ts'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/config/**',
        '!src/app.ts'
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/',
        '/dist/'
    ],
    moduleFileExtensions: ['ts', 'js', 'json'],
    coverageDirectory: 'coverage',
    verbose: true,
    maxWorkers: 1
};
