import { expect, test } from '@playwright/test';

test.describe('Authenticated Session Reuse', () => {
    test('login page redirects away when session is already present', async ({
        page
    }) => {
        await page.goto('/login');
        await expect(page).not.toHaveURL(/\/login$/);
    });

    test('protected events route is reachable without re-login', async ({
        page
    }) => {
        await page.goto('/events');
        await expect(page).toHaveURL(/\/events$/);
    });

    test('donate page renders member messaging when logged in', async ({
        page
    }) => {
        await page.goto('/donate');
        await expect(
            page.getByText(/thanks for supporting the community/i)
        ).toBeVisible();
    });
});
