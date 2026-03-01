import { defineConfig, devices } from '@playwright/test';

const managedWebBaseURL =
    process.env.PLAYWRIGHT_WEB_BASE_URL ?? 'http://localhost:3000';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? managedWebBaseURL;
const authFile = 'playwright/.auth/user.json';
const managedPort = new URL(managedWebBaseURL).port || '3000';
const backendURI = process.env.PLAYWRIGHT_BACKEND_URI ?? 'http://localhost';
const wssURI = process.env.PLAYWRIGHT_WSS_URI ?? 'ws://localhost';
const manageWebServer = process.env.PLAYWRIGHT_NO_WEBSERVER !== '1';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL,
        trace: 'on-first-retry',
        geolocation: { latitude: 37.7749, longitude: -122.4194 },
        permissions: ['geolocation']
    },
    webServer: manageWebServer
        ? {
            command: 'yarn start',
            url: managedWebBaseURL,
            timeout: 240_000,
            reuseExistingServer: !process.env.CI,
            env: {
                PORT: managedPort,
                BROWSER: 'none',
                CI: 'true',
                REACT_APP_BACKEND_URI: backendURI,
                REACT_APP_WSS_URI: wssURI
            }
        }
        : undefined,
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            testIgnore: ['**/*.auth.spec.ts', '**/auth.setup.ts']
        },
        {
            name: 'auth-setup',
            use: { ...devices['Desktop Chrome'] },
            testMatch: ['**/auth.setup.ts']
        },
        {
            name: 'chromium-auth',
            use: {
                ...devices['Desktop Chrome'],
                storageState: authFile
            },
            dependencies: ['auth-setup'],
            testMatch: ['**/*.auth.spec.ts']
        }
    ]
});
