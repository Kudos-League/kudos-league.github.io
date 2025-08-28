import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        geolocation: { latitude: 37.7749, longitude: -122.4194 },
        permissions: ['geolocation'],
    },
    webServer: {
        command: 'yarn start',             // runs your craco start
        url: 'http://localhost:3000',
        timeout: 240_000,
        reuseExistingServer: !process.env.CI,
        env: { PORT: '3000', BROWSER: 'none', CI: 'true' },
    },
    projects: [
        // { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        // { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
    ],
});
