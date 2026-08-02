import { test, type Page } from '@playwright/test';

import { bootstrapAuth, CORS } from './utils/auth';

const SHOT_DIR =
    process.env.DEMO_SHOT_DIR ?? '/tmp/award-demo';

const json = (body: unknown, status = 200) => ({
    status,
    headers: { 'content-type': 'application/json', ...CORS },
    body: JSON.stringify(body)
});

const PNG_BYTES = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAUAAAADwCAYAAABxLb1rAAAAyklEQVR4nO3BMQEAAADCoPVPbQhfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgLcBHY4AAWn5UBIAAAAASUVORK5CYII=',
    'base64'
);

const GIVER = {
    id: 1,
    email: 'e2e@example.com',
    username: 'e2e-user',
    kudos: 100,
    settings: {},
    tags: [],
    location: null,
    avatar: null,
    badges: []
};

const RECIPIENT = {
    id: 2,
    email: 'bob@example.com',
    username: 'bob',
    kudos: 5,
    settings: {},
    tags: [],
    location: null,
    avatar: null,
    badges: []
};

async function shot(page: Page, name: string) {
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOT_DIR}/${name}.png` });
}

test('demo: full award-kudos flow with screenshots', async ({ page }) => {
    test.setTimeout(120_000);
    await bootstrapAuth(page, 1);
    await page.route(/\/users\/me(\?|$)/, (r) => r.fulfill(json(GIVER)));
    await page.route(/\/users\/2(\?|$)/, (r) => r.fulfill(json(RECIPIENT)));
    await page.route('**/kudos/award', (r) =>
        r.fulfill(
            json({
                giftID: 'demo-gift-1',
                amount: 25,
                title: 'Helped me move houses',
                description: 'Carried a couch up 4 floors',
                attachments: [],
                verificationStatus: 'pending',
                recipientID: 2,
                giverID: 1,
                giverTotal: 75,
                recipientTotal: 30
            })
        )
    );

    // 1 — bob's profile with the Award Kudos button + tooltip
    await page.goto('/user/2');
    await page.getByTestId('award-kudos').hover();
    await page.waitForTimeout(500);
    await shot(page, '01-profile-award-button-tooltip');

    // 2 — modal with the form filled in + evidence attached
    await page.getByTestId('award-kudos').click();
    await page.locator('#title').fill('Helped me move houses');
    await page.locator('#description').fill('Carried a couch up 4 floors');
    await page.locator('#amount').fill('25');
    await page.getByTestId('award-kudos-files').setInputFiles([
        { name: 'couch.png', mimeType: 'image/png', buffer: PNG_BYTES },
        { name: 'stairs.png', mimeType: 'image/png', buffer: PNG_BYTES }
    ]);
    await page.waitForTimeout(300);
    await shot(page, '02-modal-filled');

    // 3 — validation: amount above the 1000 kudos cap
    await page.locator('#amount').fill('1001');
    await page.getByTestId('award-kudos-submit').click();
    await page.getByText(/at most 1000 kudos at a time/i).waitFor();
    await shot(page, '03-validation-over-cap');

    // 4 — submit → success toast
    await page.locator('#amount').fill('25');
    await page.getByTestId('award-kudos-submit').click();
    await page.getByText(/awarded 25 kudos!/i).waitFor();
    await shot(page, '04-success-toast');

    // 5 — kudos history with gift entries
    await page.route('**/kudos/history*', (r) =>
        r.fulfill(
            json({
                data: [
                    {
                        id: 2,
                        delta: 25,
                        total: 30,
                        createdAt: new Date().toISOString(),
                        source: 'gift',
                        metadata: {
                            giftID: 'demo-gift-1',
                            title: 'Helped me move houses',
                            description: 'Carried a couch up 4 floors',
                            verificationStatus: 'pending',
                            direction: 'received'
                        },
                        actor: GIVER
                    },
                    {
                        id: 1,
                        delta: -10,
                        total: 5,
                        createdAt: new Date(
                            Date.now() - 86_400_000
                        ).toISOString(),
                        source: 'gift',
                        metadata: {
                            giftID: 'demo-gift-0',
                            title: 'Thanks for the garden plants',
                            verificationStatus: 'verified',
                            direction: 'given'
                        },
                        actor: GIVER
                    }
                ],
                limit: 10
            })
        )
    );
    await page.getByRole('button', { name: /^activity$/i }).click();
    await page
        .getByRole('button', { name: /view kudos reward history/i })
        .click();
    await page.getByTestId('kudos-gift-detail').first().waitFor();
    await shot(page, '05-kudos-history-gifts');

    // 6 — recipient notification in the bell
    await page.route(/\/notifications(\?|$)/, (r) =>
        r.fulfill(
            json([
                {
                    id: 501,
                    type: 'kudos-received',
                    kudos: 25,
                    userID: 1,
                    user: { id: 1, username: 'e2e-user', avatar: null },
                    isRead: false,
                    isActedOn: false,
                    createdAt: new Date().toISOString()
                }
            ])
        )
    );
    await page.goto('/user/1');
    await page.locator('button[aria-label="Notifications"]').click();
    await page.getByText(/awarded you kudos/i).waitFor();
    await shot(page, '06-notification-bell');

    // 7 — admin proof verifier
    await page.route(/\/users\/me(\?|$)/, (r) =>
        r.fulfill(json({ ...GIVER, admin: true }))
    );
    await page.route('**/admin/reports*', (r) => r.fulfill(json([])));
    await page.route(/\/feedback(\?|$)/, (r) => r.fulfill(json([])));
    await page.route('**/kudos/awards?*', (r) =>
        r.fulfill(
            json({
                data: [
                    {
                        id: 7,
                        giftID: 'demo-gift-1',
                        amount: 25,
                        title: 'Helped me move houses',
                        description: 'Carried a couch up 4 floors',
                        attachments: [],
                        verificationStatus: 'pending',
                        verifiedByID: null,
                        createdAt: new Date().toISOString(),
                        recipient: {
                            id: 2,
                            username: 'bob',
                            avatar: null,
                            kudos: 30
                        },
                        giver: {
                            id: 1,
                            username: 'e2e-user',
                            avatar: null,
                            kudos: 75
                        }
                    }
                ],
                limit: 25
            })
        )
    );
    await page.route('**/kudos/awards/demo-gift-1/verify', (r) =>
        r.fulfill(
            json({ giftID: 'demo-gift-1', verificationStatus: 'verified' })
        )
    );
    await page.goto('/admin');
    await page.getByTestId('admin-tab-kudos-proofs').click();
    await page.getByTestId('kudos-proof-card').waitFor();
    await shot(page, '07-admin-proof-verifier');

    // 8 — verify it → toast
    await page.getByTestId('kudos-proof-verify').click();
    await page.getByText(/award verified\./i).waitFor();
    await shot(page, '08-admin-verified-toast');
});
