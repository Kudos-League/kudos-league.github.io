import { expect, test, type Page } from '@playwright/test';

import { bootstrapAuth, CORS } from './utils/auth';

const SHOTS = 'test-results/kudos-followups';
const json = (body: unknown, status = 200) => ({
    status,
    headers: { 'content-type': 'application/json', ...CORS },
    body: JSON.stringify(body)
});

const ME = { id: 1, email: 'e2e@example.com', username: 'e2e-user', kudos: 100, settings: {}, tags: [], location: null, avatar: null, badges: [] };

const giftHistory = () =>
    json({
        data: [
            {
                id: 2,
                delta: 25,
                total: 125,
                createdAt: new Date().toISOString(),
                source: 'gift',
                metadata: {
                    giftID: 'g-1',
                    title: 'Helped me move houses',
                    description: 'Carried a couch up 4 floors',
                    attachments: ['/uploads/kudos/evidence.webp'],
                    verificationStatus: 'pending',
                    direction: 'received'
                },
                actor: { id: 3, username: 'alice', avatar: null }
            }
        ],
        limit: 10
    });

async function setup(page: Page) {
    await bootstrapAuth(page, 1);
    await page.route(/\/users\/me(\?|$)/, (r) => r.fulfill(json(ME)));
    await page.route(/\/users\/1(\?|$)/, (r) => r.fulfill(json(ME)));
    await page.route('**/kudos/history*', (r) => r.fulfill(giftHistory()));
    await page.route(/\/notifications(\?|$)/, (r) =>
        r.fulfill(
            json([
                {
                    id: 501,
                    type: 'kudos-received',
                    kudos: 25,
                    userID: 3,
                    user: { id: 3, username: 'alice', avatar: null },
                    isRead: false,
                    isActedOn: false,
                    createdAt: new Date().toISOString()
                }
            ])
        )
    );
    await page.route('**/notifications/**', (r) => r.fulfill(json({ ok: true })));
}

const digitalGiftPost = () =>
    json({
        id: 1,
        title: 'Free e-book: Learn TypeScript',
        body: 'A digital resource anyone can access.',
        description: 'A digital resource anyone can access.',
        type: 'gift',
        giftType: 'digital',
        status: 'open',
        sender: { id: 3, username: 'alice', kudos: 50, avatar: null },
        senderID: 3,
        createdAt: new Date().toISOString(),
        images: [],
        files: [],
        tags: [],
        location: null,
        handshakes: [],
        rewardOffers: [],
        category: null
    });

test('gift/request kudos amount is capped at 1000', async ({ page }) => {
    await bootstrapAuth(page, 1);
    await page.route(/\/users\/me(\?|$)/, (r) => r.fulfill(json(ME)));
    await page.route(/\/posts\/1(\?|$)/, (r) => r.fulfill(digitalGiftPost()));

    await page.goto('/post/1');
    await page.getByRole('button', { name: /^give kudos$/i }).click();

    // The Give Kudos modal shows the cap in its placeholder.
    const input = page.getByPlaceholder(/max 1000/i);
    await expect(input).toBeVisible();

    // Entering more than 1000 keeps the submit disabled.
    await input.fill('1500');
    await expect(page.getByRole('button', { name: /send kudos/i })).toBeDisabled();
    await page.screenshot({ path: `${SHOTS}/3-gift-kudos-cap.png` });
});

test('award notification opens the activity kudos history with proof', async ({
    page
}) => {
    await setup(page);
    await page.goto('/user/1');

    await page.locator('button[aria-label="Notifications"]').click();
    await expect(page.getByText(/alice awarded you kudos/i)).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/1-award-notification.png` });

    // Clicking the peer-award notification routes to the activity kudos history.
    await page.getByText(/alice awarded you kudos/i).click();

    await expect(page).toHaveURL(/\/activity\?filter=kudos/);
    await expect(page.getByTestId('kudos-gift-detail')).toBeVisible();
    await expect(
        page.getByText(/kudos awarded to you for a past gift/i)
    ).toBeVisible();
    // The photo proof is shown inline in the history entry.
    await expect(
        page.getByTestId('kudos-gift-detail').locator('img')
    ).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/2-activity-kudos-proof.png` });
});
