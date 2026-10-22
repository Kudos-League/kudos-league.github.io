import { defineConfig, devices } from '@playwright/test';
// Ad-hoc config for running *.driver.ts demo scripts (not part of the suite).
export default defineConfig({
    testDir: './tests',
    testMatch: ['**/*.driver.ts'],
    timeout: 120_000,
    reporter: [['list']],
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
        geolocation: { latitude: 37.7749, longitude: -122.4194 },
        permissions: ['geolocation']
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
