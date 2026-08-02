import { expect, test, type Page, type Route } from '@playwright/test';

import { bootstrapAuth, CORS } from './utils/auth';

const json = (body: unknown, status = 200) => ({
    status,
    headers: { 'content-type': 'application/json', ...CORS },
    body: JSON.stringify(body)
});

// 1x1 red pixel PNG
const PNG_BYTES = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
    'base64'
);

const evidenceFile = (name = 'evidence.png') => ({
    name,
    mimeType: 'image/png',
    buffer: PNG_BYTES
});

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

/** Mocked session: current user (id 1, 100 kudos) viewing bob (id 2). */
async function setupAwardPage(page: Page) {
    await bootstrapAuth(page, 1);
    // page routes take precedence over bootstrapAuth's context catch-all
    await page.route(/\/users\/me(\?|$)/, (route) =>
        route.fulfill(json(GIVER))
    );
    await page.route(/\/users\/2(\?|$)/, (route) =>
        route.fulfill(json(RECIPIENT))
    );
}

async function openAwardModal(page: Page) {
    await page.goto('/user/2');
    await page.getByTestId('award-kudos').click();
    await expect(
        page.getByRole('heading', { name: /award kudos to bob/i })
    ).toBeVisible();
}

test.describe('Award kudos — entry points and tooltip', () => {
    test('profile of another user shows the Award Kudos button with the explanatory hover tooltip', async ({
        page
    }) => {
        await setupAwardPage(page);
        await page.goto('/user/2');

        const awardButton = page.getByTestId('award-kudos');
        await expect(awardButton).toBeVisible();

        // hover → tooltip explains awards are for past gifts / off-site help
        await awardButton.hover();
        const tooltip = page.getByTestId('kudos-info-tooltip');
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText(/past gifts/i);
        await expect(tooltip).toContainText(/outside\s+the website/i);
        await expect(tooltip).toContainText(/freely given/i);
    });

    test('own profile does not offer awarding kudos to yourself', async ({
        page
    }) => {
        await bootstrapAuth(page, 1);
        await page.goto('/user/1');
        await expect(page.getByTestId('edit-profile')).toBeVisible();
        await expect(page.getByTestId('award-kudos')).toHaveCount(0);
    });

    test('modal shows the explanatory tooltip on the info trigger', async ({
        page
    }) => {
        await setupAwardPage(page);
        await openAwardModal(page);

        await page.getByTestId('kudos-info-trigger').hover();
        await expect(page.getByTestId('kudos-info-tooltip')).toContainText(
            /past gifts/i
        );
    });
});

test.describe('Award kudos — form validation', () => {
    test('rejects empty title and non-positive amounts (no balance cap — kudos are freely given)', async ({
        page
    }) => {
        await setupAwardPage(page);

        let awardCalled = false;
        await page.route('**/kudos/award', (route) => {
            awardCalled = true;
            return route.fulfill(
                json({
                    giftID: 'g-x',
                    amount: 500,
                    title: 'Helped me fix my bike',
                    description: null,
                    attachments: [],
                    verificationStatus: 'pending',
                    recipientID: 2,
                    giverID: 1,
                    giverTotal: 100,
                    recipientTotal: 505
                })
            );
        });

        await openAwardModal(page);

        // Empty form
        await page.getByTestId('award-kudos-submit').click();
        await expect(page.getByText(/title is required/i)).toBeVisible();
        await expect(
            page.getByText(/enter how many kudos to award/i)
        ).toBeVisible();

        await page.locator('#title').fill('Helped me fix my bike');

        // Zero amount
        await page.locator('#amount').fill('0');
        await page.getByTestId('award-kudos-submit').click();
        await expect(
            page.getByText(/kudos must be a positive whole number/i)
        ).toBeVisible();

        // Too-short title
        await page.locator('#title').fill('ab');
        await page.locator('#amount').fill('10');
        await page.getByTestId('award-kudos-submit').click();
        await expect(
            page.getByText(/title must be at least 3 characters/i)
        ).toBeVisible();

        // Amounts above the giver's own kudos are allowed — freely given
        await page.locator('#title').fill('Helped me fix my bike');
        await page.locator('#amount').fill('500');
        await page.getByTestId('award-kudos-submit').click();
        await expect(page.getByText(/awarded 500 kudos!/i)).toBeVisible();
        expect(awardCalled).toBe(true);
    });

    test('rejects amounts above the 1000 kudos cap', async ({ page }) => {
        await setupAwardPage(page);

        let awardCalled = false;
        await page.route('**/kudos/award', (route) => {
            awardCalled = true;
            return route.fulfill(
                json({
                    giftID: 'g-cap',
                    amount: 1000,
                    title: 'Helped me fix my bike',
                    description: null,
                    attachments: [],
                    verificationStatus: 'pending',
                    recipientID: 2,
                    giverID: 1,
                    giverTotal: 100,
                    recipientTotal: 1005
                })
            );
        });

        await openAwardModal(page);
        await page.locator('#title').fill('Helped me fix my bike');

        // Over the cap — blocked client-side, never reaches the server
        await page.locator('#amount').fill('1001');
        await page.getByTestId('award-kudos-submit').click();
        await expect(
            page.getByText(/at most 1000 kudos at a time/i)
        ).toBeVisible();
        expect(awardCalled).toBe(false);

        // Exactly at the cap — allowed
        await page.locator('#amount').fill('1000');
        await page.getByTestId('award-kudos-submit').click();
        await expect(page.getByText(/awarded 1000 kudos!/i)).toBeVisible();
        expect(awardCalled).toBe(true);
    });

    test('photo evidence can be attached, previewed and removed', async ({
        page
    }) => {
        await setupAwardPage(page);
        await openAwardModal(page);

        const fileInput = page.getByTestId('award-kudos-files');
        await fileInput.setInputFiles([
            evidenceFile('one.png'),
            evidenceFile('two.png')
        ]);
        await expect(page.getByTestId('award-kudos-preview')).toHaveCount(2);

        await page.getByTestId('award-kudos-remove-0').click();
        await expect(page.getByTestId('award-kudos-preview')).toHaveCount(1);

        // Exceeding the 5-photo cap surfaces an error and keeps the previous selection
        await fileInput.setInputFiles([
            evidenceFile('a.png'),
            evidenceFile('b.png'),
            evidenceFile('c.png'),
            evidenceFile('d.png'),
            evidenceFile('e.png')
        ]);
        await expect(
            page.getByTestId('award-kudos-file-error')
        ).toContainText(/max 5 photos/i);
        await expect(page.getByTestId('award-kudos-preview')).toHaveCount(1);
    });
});

test.describe('Award kudos — submission', () => {
    test('submits a multipart award, shows the success toast and closes the modal', async ({
        page
    }) => {
        await setupAwardPage(page);

        const awardRequest = new Promise<string>((resolve) => {
            page.route('**/kudos/award', async (route: Route) => {
                const req = route.request();
                const bodyBuffer = req.postDataBuffer();
                await route.fulfill(
                    json({
                        giftID: 'e2e-gift-1',
                        amount: 25,
                        title: 'Helped me move houses',
                        description: 'Carried a couch up 4 floors',
                        attachments: ['/uploads/kudos/evidence.webp'],
                        verificationStatus: 'pending',
                        recipientID: 2,
                        giverID: 1,
                        giverTotal: 75,
                        recipientTotal: 30
                    })
                );
                resolve(
                    bodyBuffer
                        ? bodyBuffer.toString('utf8')
                        : req.postData() ?? ''
                );
            });
        });

        await openAwardModal(page);

        await page.locator('#title').fill('Helped me move houses');
        await page
            .locator('#description')
            .fill('Carried a couch up 4 floors');
        await page.locator('#amount').fill('25');
        await page
            .getByTestId('award-kudos-files')
            .setInputFiles([evidenceFile()]);
        await expect(page.getByTestId('award-kudos-preview')).toHaveCount(1);

        await page.getByTestId('award-kudos-submit').click();

        const requestBody = await awardRequest;
        expect(requestBody).toContain('name="recipientID"');
        expect(requestBody).toContain('\r\n2\r\n');
        expect(requestBody).toContain('name="title"');
        expect(requestBody).toContain('Helped me move houses');
        expect(requestBody).toContain('name="description"');
        expect(requestBody).toContain('Carried a couch up 4 floors');
        expect(requestBody).toContain('name="amount"');
        expect(requestBody).toContain('\r\n25\r\n');
        expect(requestBody).toContain('name="files[0]"');
        expect(requestBody).toContain('filename="evidence.png"');

        await expect(page.getByText(/awarded 25 kudos!/i)).toBeVisible();
        await expect(
            page.getByRole('heading', { name: /award kudos to bob/i })
        ).toHaveCount(0);
    });

    test('surfaces a server rejection as an error toast and keeps the modal open', async ({
        page
    }) => {
        await setupAwardPage(page);
        await page.route('**/kudos/award', (route) =>
            route.fulfill(
                json({ message: 'You cannot award kudos to yourself.' }, 400)
            )
        );

        await openAwardModal(page);
        await page.locator('#title').fill('Nice try');
        await page.locator('#amount').fill('100');
        await page.getByTestId('award-kudos-submit').click();

        await expect(
            page.getByText(/cannot award kudos to yourself/i)
        ).toBeVisible();
        await expect(
            page.getByRole('heading', { name: /award kudos to bob/i })
        ).toBeVisible();
    });
});

test.describe('Award kudos — transactions history', () => {
    test('kudos history renders gift entries with verification status, evidence and direction', async ({
        page
    }) => {
        await setupAwardPage(page);
        await page.route('**/kudos/history*', (route) =>
            route.fulfill(
                json({
                    data: [
                        {
                            id: 2,
                            delta: 25,
                            total: 30,
                            createdAt: new Date().toISOString(),
                            source: 'gift',
                            metadata: {
                                giftID: 'g-1',
                                title: 'Helped me move houses',
                                description: 'Carried a couch',
                                attachments: ['/uploads/kudos/evidence.webp'],
                                verificationStatus: 'pending',
                                direction: 'received'
                            },
                            actor: GIVER
                        },
                        {
                            id: 1,
                            delta: -10,
                            total: 5,
                            createdAt: new Date().toISOString(),
                            source: 'gift',
                            metadata: {
                                giftID: 'g-0',
                                title: 'Thanks for the plants',
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

        await page.goto('/user/2');
        await page.getByRole('button', { name: /^activity$/i }).click();
        await page
            .getByRole('button', { name: /view kudos reward history/i })
            .click();

        await expect(page.getByTestId('kudos-gift-detail')).toHaveCount(2);
        await expect(page.getByText('+25 Kudos')).toBeVisible();
        await expect(page.getByText('-10 Kudos')).toBeVisible();
        await expect(
            page.getByText(/kudos awarded to you for a past gift/i)
        ).toBeVisible();
        await expect(
            page.getByText(/you awarded kudos for a past gift/i)
        ).toBeVisible();
        await expect(
            page.getByTestId('kudos-gift-verification').filter({
                hasText: /pending verification/i
            })
        ).toBeVisible();
        await expect(
            page.getByTestId('kudos-gift-verification').filter({
                hasText: /^Verified$/
            })
        ).toBeVisible();

        // The "Kudos awards" filter narrows to gift sources
        await expect(
            page.locator('select option[value="gift"]')
        ).toHaveCount(1);
    });
});

test.describe('Award kudos — recipient notification', () => {
    test('notification bell attributes the award to the giver and shows the amount', async ({
        page
    }) => {
        await bootstrapAuth(page, 1);
        await page.route(/\/notifications(\?|$)/, (route) =>
            route.fulfill(
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

        await page.goto('/user/1');
        await page.locator('button[aria-label="Notifications"]').click();

        await expect(
            page.getByText(/alice awarded you kudos/i)
        ).toBeVisible();
        await expect(
            page.getByText(/you received 25 kudos!/i)
        ).toBeVisible();
    });
});

test.describe('Award kudos — admin proof verifier', () => {
    const PENDING_AWARD = {
        id: 7,
        giftID: 'g-7',
        amount: 25,
        title: 'Helped me move houses',
        description: 'Carried a couch up 4 floors',
        attachments: ['/uploads/kudos/evidence.webp'],
        verificationStatus: 'pending',
        verifiedByID: null,
        createdAt: new Date().toISOString(),
        recipient: { id: 2, username: 'bob', avatar: null, kudos: 30 },
        giver: { id: 1, username: 'e2e-user', avatar: null, kudos: 75 }
    };

    async function setupAdmin(page: Page) {
        await bootstrapAuth(page, 1);
        await page.route(/\/users\/me(\?|$)/, (route) =>
            route.fulfill(json({ ...GIVER, admin: true }))
        );
        await page.route('**/admin/reports*', (route) =>
            route.fulfill(json([]))
        );
        await page.route(/\/feedback(\?|$)/, (route) =>
            route.fulfill(json([]))
        );
    }

    test('lists pending awards with evidence and verifies one', async ({
        page
    }) => {
        await setupAdmin(page);
        await page.route('**/kudos/awards?*', (route) =>
            route.fulfill(json({ data: [PENDING_AWARD], limit: 25 }))
        );

        const verifyRequest = new Promise<string>((resolve) => {
            page.route('**/kudos/awards/g-7/verify', async (route) => {
                await route.fulfill(
                    json({ giftID: 'g-7', verificationStatus: 'verified' })
                );
                resolve(route.request().postData() ?? '');
            });
        });

        await page.goto('/admin');
        await page.getByTestId('admin-tab-kudos-proofs').click();

        const card = page.getByTestId('kudos-proof-card');
        await expect(card).toBeVisible();
        await expect(card).toContainText('25 Kudos');
        await expect(card).toContainText('Helped me move houses');
        await expect(card).toContainText('e2e-user');
        await expect(card).toContainText('bob');
        await expect(card.locator('img')).toHaveCount(1);
        await expect(page.getByTestId('kudos-proof-status')).toContainText(
            'pending'
        );

        await page.getByTestId('kudos-proof-verify').click();

        const body = await verifyRequest;
        expect(body).toContain('"action":"verify"');
        await expect(page.getByText(/award verified\./i)).toBeVisible();
    });

    test('rejecting an award asks for confirmation and reports the refund', async ({
        page
    }) => {
        await setupAdmin(page);
        await page.route('**/kudos/awards?*', (route) =>
            route.fulfill(json({ data: [PENDING_AWARD], limit: 25 }))
        );

        const rejectRequest = new Promise<string>((resolve) => {
            page.route('**/kudos/awards/g-7/verify', async (route) => {
                await route.fulfill(
                    json({ giftID: 'g-7', verificationStatus: 'rejected' })
                );
                resolve(route.request().postData() ?? '');
            });
        });

        let confirmMessage = '';
        page.on('dialog', (dialog) => {
            confirmMessage = dialog.message();
            dialog.accept();
        });

        await page.goto('/admin');
        await page.getByTestId('admin-tab-kudos-proofs').click();
        await page.getByTestId('kudos-proof-reject').click();

        const body = await rejectRequest;
        expect(body).toContain('"action":"reject"');
        expect(confirmMessage).toMatch(/25 kudos will be removed/i);
        await expect(
            page.getByText(/award rejected — kudos revoked\./i)
        ).toBeVisible();
    });

    test('dismissing the reject confirmation leaves the award untouched', async ({
        page
    }) => {
        await setupAdmin(page);
        await page.route('**/kudos/awards?*', (route) =>
            route.fulfill(json({ data: [PENDING_AWARD], limit: 25 }))
        );

        let verifyCalled = false;
        await page.route('**/kudos/awards/g-7/verify', async (route) => {
            verifyCalled = true;
            await route.fulfill(
                json({ giftID: 'g-7', verificationStatus: 'rejected' })
            );
        });

        page.on('dialog', (dialog) => dialog.dismiss());

        await page.goto('/admin');
        await page.getByTestId('admin-tab-kudos-proofs').click();
        await page.getByTestId('kudos-proof-reject').click();

        await expect(page.getByTestId('kudos-proof-status')).toContainText(
            'pending'
        );
        expect(verifyCalled).toBe(false);
    });
});
