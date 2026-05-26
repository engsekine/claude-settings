import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env['CI'],
    retries: process.env['CI'] ? 2 : 0,
    ...(process.env['CI'] ? { workers: 1 } : {}),
    reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'html',

    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        locale: 'ja-JP',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: {
        command: 'npm run dev',
        url: BASE_URL,
        reuseExistingServer: !process.env['CI'],
        stdout: 'ignore',
        stderr: 'pipe',
        timeout: 120_000,
    },
});
