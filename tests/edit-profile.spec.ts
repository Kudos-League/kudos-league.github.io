/* eslint-disable @typescript-eslint/ban-ts-comment */
import { test, expect, type Page, type Request } from '@playwright/test';

import { CORS, bootstrapAuth } from './utils/auth';

const SAVE_BTN = /save changes/i;
const ONE_BY_ONE_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/af9eAsAAAAASUVORK5CYII=';

test.describe('Edit Profile', () => {
    test('save disabled until change; about edit enables save & is sent', async ({ page }) => {
        await navigateToEdit(page);

        const save = page.getByRole('button', { name: SAVE_BTN });
        await expect(save).toBeDisabled();

        const aboutVal = `Playwright about ${Date.now()}`;
        await page.getByTestId('about').fill(aboutVal);
        await expect(save).toBeEnabled();

        const patch = waitForUserPatch(page, ({ headers, bodyText }) => {
            expect(headers['content-type']).toContain('multipart/form-data');
            expect(bodyText).toContain('name="about"');
            expect(bodyText).toContain(aboutVal);
            expect(bodyText).not.toMatch(/filename="/);
        });

        await save.click();
        await patch;
    });

    test('avatar upload enables save and sends multipart with file', async ({ page }) => {
        await navigateToEdit(page);

        await page.getByRole('button', { name: /change avatar/i }).click();

        const fileName = 'avatar.png';
        await page.locator('#avatar-file-input').setInputFiles({
            name: fileName,
            mimeType: 'image/png',
            // @ts-ignore
            buffer: Buffer.from(ONE_BY_ONE_PNG, 'base64'),
        });

        const save = page.getByRole('button', { name: SAVE_BTN });
        await expect(save).toBeEnabled();

        const patch = waitForUserPatch(page, ({ headers, bodyText }) => {
            expect(headers['content-type']).toContain('multipart/form-data');
            expect(bodyText).toMatch(/name="avatar"/);
            expect(bodyText).toMatch(new RegExp(`filename="${fileName}"`));
        });

        await save.click();
        await patch;
    });

    test('removing uploaded avatar disables save again (no other changes)', async ({ page }) => {
        await navigateToEdit(page);

        await page.getByRole('button', { name: /change avatar/i }).click();
        await page.locator('#avatar-file-input').setInputFiles({
            name: 'avatar.png',
            mimeType: 'image/png',
            // @ts-ignore
            buffer: Buffer.from(ONE_BY_ONE_PNG, 'base64'),
        });

        const save = page.getByRole('button', { name: SAVE_BTN });
        await expect(save).toBeEnabled();

        await page.getByRole('button', { name: /change avatar/i }).click();
        await page.getByTestId('remove-avatar').click();

        await expect(save).toBeDisabled();
    });

    test('cancel/back returns to profile view', async ({ page }) => {
        await navigateToEdit(page);
        await page.getByRole('button', { name: /cancel/i }).click();
        await expect(getEditButton(page)).toBeVisible();
    });
});

async function navigateToEdit(page: Page) {
    page.on('pageerror', e => console.log('pageerror:', e));
    // page.on('console', m => m.type() === 'error' && console.log('console error:', m.text()));

    await bootstrapAuth(page, 1);
    await page.goto('/user/1');

    const edit = getEditButton(page);
    await expect(edit).toBeVisible({ timeout: 10_000 });
    await edit.click();

    await expect(page.getByTestId('account-settings')).toBeVisible({ timeout: 10_000 });
}

function getEditButton(page: Page) {
    const byTid = page.getByTestId('edit-profile');
    return byTid.filter({ hasText: /edit/i }).first().or(
        page.getByRole('button', { name: /edit/i }).first()
    );
}

function waitForUserPatch(
    page: Page,
    assert: (data: { request: Request; headers: Record<string,string>; bodyText: string }) => void
) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (resolve) => {
        await page.route('**/users/**', async (route) => {
            const req = route.request();
            if (req.method() !== 'PATCH') return route.continue();

            const headers = req.headers();
            const buf = req.postDataBuffer();
            const bodyText = buf ? buf.toString('utf8') : (req.postData() ?? '');
            assert({ request: req, headers, bodyText });

            await route.fulfill({
                status: 200,
                headers: { 'content-type': 'application/json', ...CORS },
                body: JSON.stringify({
                    id: 1,
                    email: 'me@example.com',
                    settings: {},
                    tags: [],
                    location: null,
                    avatar: null,
                }),
            });
            resolve();
        });
    });
}

