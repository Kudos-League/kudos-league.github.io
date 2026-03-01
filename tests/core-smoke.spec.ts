import { expect, test } from '@playwright/test';

import { bootstrapAuth } from './utils/auth';

test.describe('Core Smoke', () => {
    test('home navigates to about page from Learn More CTA', async ({ page }) => {
        await page.goto('/');

        const learnMore = page
            .getByRole('button', { name: /learn more/i })
            .first();
        await expect(learnMore).toBeVisible();

        await learnMore.click();

        await expect(page).toHaveURL(/\/about$/);
        await expect(
            page.getByRole('heading', {
                name: /welcome to the kudos league foundation/i
            })
        ).toBeVisible();
    });

    test('donate page shows guest state when logged out', async ({ page }) => {
        await page.goto('/donate');

        await expect(page.getByText(/donating as a guest/i)).toBeVisible();
        await expect(
            page.getByRole('link', { name: /log in to earn kudos/i })
        ).toBeVisible();
    });

    test('protected route redirects to login when logged out', async ({
        page
    }) => {
        await page.goto('/events');

        await expect(page).toHaveURL(/\/login$/);
        await expect(
            page.getByRole('heading', { name: /sign in to your account/i })
        ).toBeVisible();
    });

    test('logged-in user can open profile settings', async ({ page }) => {
        await bootstrapAuth(page, 1);
        await page.goto('/user/1');

        const editButton = page.getByTestId('edit-profile');
        await expect(editButton).toBeVisible();
        await editButton.click();

        await expect(
            page.getByRole('heading', { name: /account settings/i })
        ).toBeVisible();
    });
});
