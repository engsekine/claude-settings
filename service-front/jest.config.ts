import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig: Config = {
    setupFilesAfterEnv: ['@testing-library/jest-dom', '<rootDir>/jest.setup.ts'],
    testEnvironment: 'jest-fixed-jsdom',
    coverageProvider: 'v8',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@mocks/(.*)$': '<rootDir>/__mocks__/$1',
        // 静的ファイルのモック
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|svg|webp|avif)$': '<rootDir>/__mocks__/fileMock.ts',
    },
    resolver: undefined,
    testPathIgnorePatterns: ['/node_modules/', '/.next/', '/playwright/'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    testMatch: ['**/__tests__/**/*.(spec|test).[jt]s?(x)'],
    testEnvironmentOptions: {
        customExportConditions: [''],
    },
    transformIgnorePatterns: [
        'node_modules/(?!(msw|@mswjs|until-async|@bundled-es-modules|strict-event-emitter|@open-draft)/)',
    ],
    // カバレッジ設定
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.tsx',
        '!src/app/**/layout.tsx',
        '!src/app/**/loading.tsx',
        '!src/app/**/error.tsx',
        '!src/app/**/not-found.tsx',
    ],
    coverageThresholds: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },
};

export default createJestConfig(customJestConfig);
