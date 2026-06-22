import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            '@': path.join(dirname, 'src'),
        },
    },
    test: {
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/**/*.d.ts',
                'src/**/index.ts',
                'src/**/types.ts',
                'src/**/constants.ts',
                'src/app/**',
                'src/proxy.ts',
                'src/shared/lib/supabase/**',
                'src/**/server/actions.ts',
                'src/**/server/queries.ts',
                'src/shared/config/metadata.ts',
            ],
        },
        projects: [
            {
                extends: true,
                test: {
                    name: 'unit',
                    environment: 'jsdom',
                    globals: true,
                    setupFiles: ['./vitest.setup.ts'],
                    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
                    exclude: ['node_modules', '.next', 'tests/e2e/**', '**/*.stories.{ts,tsx}'],
                },
            },
        ],
    },
});
