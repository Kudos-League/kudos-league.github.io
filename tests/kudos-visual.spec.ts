import { expect, test, type Page } from '@playwright/test';

import { bootstrapAuth, CORS } from './utils/auth';

const SHOTS = 'test-results/kudos-visual';
const json = (body: unknown, status = 200) => ({
    status,
    headers: { 'content-type': 'application/json', ...CORS },
    body: JSON.stringify(body)
});

// Owner has a displayName distinct from username to prove names, not usernames.
const ME = {
    id: 1,
    email: 'e2e@example.com',
    username: 'e2e_user_handle',
    displayName: 'Dana Owner',
    kudos: 100,
    settings: {},
    tags: [],
    location: null,
    avatar: null,
    badges: []
};

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
                    verificationStatus: 'verified',
                    direction: 'received'
                },
                actor: {
                    id: 3,
                    username: 'alice_handle',
                    displayName: 'Alice Giver',
                    avatar: null
                }
            }
        ],
        limit: 10
    });

const PNG_BYTES = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
    'base64'
);

async function setup(page: Page) {
    await bootstrapAuth(page, 1);
    await page.route(/\/users\/me(\?|$)/, (r) => r.fulfill(json(ME)));
    await page.route(/\/users\/1(\?|$)/, (r) => r.fulfill(json(ME)));
    await page.route('**/kudos/history*', (r) => r.fulfill(giftHistory()));
    // Serve the evidence image so the lightbox actually renders.
    await page.route('**/uploads/kudos/**', (r) =>
        r.fulfill({
            status: 200,
            headers: { 'content-type': 'image/png', ...CORS },
            body: PNG_BYTES
        })
    );
}

const noImagePost = () =>
    json([
        {
            id: 7,
            title: 'Spare winter coat, size M',
            body: 'Barely used, happy to give it away.',
            type: 'gift',
            giftType: 'physical',
            status: 'open',
            images: [],
            sender: ME,
            senderID: 1,
            createdAt: new Date().toISOString(),
            tags: [],
            location: null,
            handshakes: [],
            rewardOffers: []
        }
    ]);

test('post with no image shows the KLF logo placeholder, not text', async ({
    page
}) => {
    await setup(page);
    await page.route(/\/users\/1\/posts(\?|$)/, (r) => r.fulfill(noImagePost()));

    await page.goto('/activity');
    await page.getByRole('button', { name: /^posts$/i }).click();
    await expect(page.getByText(/spare winter coat/i).first()).toBeVisible();
    // The placeholder shows the KLF logo image, not the post title text.
    await expect(
        page.locator('img[src*="logo.webp"]').first()
    ).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/3-klf-placeholder.png` });
});

test('activity uses display names + image opens an on-site modal; no Groups nav', async ({
    page
}) => {
    await setup(page);
    await page.goto('/activity');
    await page.getByRole('button', { name: /view kudos reward history/i }).click();
    await expect(page.getByTestId('kudos-gift-detail')).toBeVisible();

    // Left nav no longer shows the Groups/Communities button.
    await expect(page.getByRole('link', { name: /^groups$/i })).toHaveCount(0);
    await page.screenshot({ path: `${SHOTS}/1-activity-names-no-groups.png` });

    // Clicking the evidence image opens an on-site lightbox (no navigation).
    const before = page.url();
    await page.getByTestId('kudos-gift-detail').locator('img').click();
    await expect(page.getByRole('button', { name: /close modal/i })).toBeVisible();
    expect(page.url()).toBe(before);
    await page.screenshot({ path: `${SHOTS}/2-image-modal.png` });
});
