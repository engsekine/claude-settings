import { defineConfig, devices } from '@playwright/test';

const PORT = 9323;
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
        // Docker 側 dev サーバーと .next を共有しないよう専用 dist dir を使う（キャッシュ破損防止）
        command: `NEXT_DIST_DIR=.next-playwright next dev -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env['CI'],
        stdout: 'ignore',
        stderr: 'pipe',
        timeout: 120_000,
    },
});
