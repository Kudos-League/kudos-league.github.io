import { expect, test, type Page } from '@playwright/test';

import { CORS } from './utils/auth';

test.describe('Create Post (Authenticated Session)', () => {
    test('logged-in session can create a post', async ({ page }) => {
        const unique = Date.now();
        const title = `Playwright Post ${unique}`;
        const body = `Post body ${unique}`;
        const quantity = '1';

        const createPostRequest = waitForCreatePostRequest(page);

        await page.goto('/create-post');
        await expect(page).toHaveURL(/\/create-post$/);

        await page.locator('#title').fill(title);
        await page.locator('#body').fill(body);
        await page.locator('#itemsLimit').fill(quantity);

        await page.getByRole('button', { name: /^create$/i }).click();

        const requestBody = await createPostRequest;
        expect(requestBody).toContain('name="title"');
        expect(requestBody).toContain(title);
        expect(requestBody).toContain('name="body"');
        expect(requestBody).toContain(body);
        expect(requestBody).toContain('name="itemsLimit"');
        expect(requestBody).toContain(`\r\n${quantity}\r\n`);

        await expect(page.getByText(/post created\./i)).toBeVisible();
    });
});

function waitForCreatePostRequest(page: Page) {
    return new Promise<string>((resolve, reject) => {
        let resolved = false;
        const timeout = setTimeout(() => {
            if (resolved) return;
            reject(new Error('Timed out waiting for POST /posts request.'));
        }, 15_000);

        page.route('**/posts', async (route) => {
            const req = route.request();
            if (req.method() !== 'POST') return route.continue();

            const postDataBuffer = req.postDataBuffer();
            const postBodyText = postDataBuffer
                ? postDataBuffer.toString('utf8')
                : req.postData() ?? '';

            await route.fulfill({
                status: 201,
                headers: { 'content-type': 'application/json', ...CORS },
                body: JSON.stringify({
                    id: 987654,
                    title: 'Playwright stubbed post',
                    body: 'Created in e2e',
                    type: 'gift',
                    itemsLimit: 1,
                    liked: false,
                    likesCount: 0,
                    commentsCount: 0,
                    tags: [],
                    categoryID: null,
                    images: [],
                    location: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    user: {
                        id: 1,
                        username: 'playwrightauth',
                        kudos: 0
                    }
                })
            });

            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                resolve(postBodyText);
            }
        });
    });
}
