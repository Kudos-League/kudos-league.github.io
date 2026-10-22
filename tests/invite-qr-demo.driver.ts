import { test, expect, type Page } from '@playwright/test';
import { bootstrapAuth, CORS } from './utils/auth';

const SHOT_DIR = process.env.DEMO_SHOT_DIR ?? '/tmp/invite-demo';
const INVITE_TOKEN = 'deadbeefcafe0123456789abcdef0123456789abcdef0123';
const INVITE_URL = `http://localhost:3000/signup?invite=${INVITE_TOKEN}`;

const json = (body: unknown, status = 200) => ({
    status,
    headers: { 'content-type': 'application/json', ...CORS },
    body: JSON.stringify(body)
});

async function shot(page: Page, name: string) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });
}

test('admin creates invite → QR card with copy/download/print', async ({ page, context }) => {
    test.setTimeout(240_000);
    await bootstrapAuth(page, 1, { user: { admin: true, username: 'admin-user' } });

    // Let the real third-party QR service through (catch-all would stub fetch()).
    await page.route('https://api.qrserver.com/**', (r) => r.continue());
    page.on('requestfailed', (r) => { if (r.url().includes('qrserver')) console.log('QR REQUEST FAILED', r.url(), r.failure()?.errorText); });
    page.on('response', (r) => { if (r.url().includes('qrserver')) console.log('QR RESPONSE', r.status(), r.headers()['content-type']); });

    const invites: any[] = [];
    await page.route(/\/users\/invites(\?|$)/, async (route, req) => {
        if (req.method() === 'GET') {
            return route.fulfill(json({ invites, nextCursor: null }));
        }
        if (req.method() === 'POST') {
            const invite = {
                id: invites.length + 1,
                createdByUserID: 1,
                targetEmail: null,
                usedByUserID: null,
                usedAt: null,
                revoked: false,
                inviteUrl: INVITE_URL,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            invites.unshift(invite);
            return route.fulfill(json({ token: INVITE_TOKEN, inviteUrl: INVITE_URL, invite }));
        }
        return route.continue();
    });

    await page.goto('/user/1');
    await expect(page.getByText('Manage invites')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/unlimited invites/)).toBeVisible();
    await page.getByText('Manage invites').scrollIntoViewIfNeeded();
    await shot(page, '01-invite-manager-admin');

    await page.getByRole('button', { name: 'Create invite' }).click();
    const qr = page.getByAltText('Invite link QR code');
    await expect(qr).toBeVisible();
    // Image actually loaded from the third party
    await expect
        .poll(async () => qr.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth), { timeout: 20_000 })
        .toBeGreaterThan(0);
    await expect(page.getByText(INVITE_URL)).toBeVisible();
    await qr.scrollIntoViewIfNeeded();
    await shot(page, '02-invite-created-qr');

    // Copy
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toBe(INVITE_URL);

    // Download
    const dl = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download QR (PNG)' }).click();
    const download = await dl;
    expect(download.suggestedFilename()).toBe('kudos-invite-qr.png');
    const path = `${SHOT_DIR}/downloaded-qr.png`;
    await download.saveAs(path);

    // Print → popup with QR + link; stub window.print so it doesn't block
    await context.addInitScript(() => {
        (window as any).__printed = 0;
        (window as any).print = () => { (window as any).__printed += 1; };
    });
    const popupP = context.waitForEvent('page');
    await page.getByRole('button', { name: 'Print QR' }).click();
    const popup = await popupP;
    await popup.waitForLoadState();
    await expect.poll(() => popup.evaluate(() => (window as any).__printed), { timeout: 20_000 }).toBeGreaterThan(0);
    const printImg = popup.locator('img#qr');
    expect(await printImg.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1000);
    expect(await printImg.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    await popup.screenshot({ path: `${SHOT_DIR}/03-print-sheet.png` });
    await expect(popup.getByText(INVITE_URL)).toBeVisible();
    await popup.close();
});

test('visitor keeps invite via cookie after leaving signup', async ({ page }) => {
    test.setTimeout(120_000);
    // Logged out: generic stubs only
    await page.route('**/*', async (route, req) => {
        const rt = req.resourceType();
        if (!['xhr', 'fetch'].includes(rt) && req.method() !== 'OPTIONS') return route.continue();
        if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
        if (/\/users\/me(\?|$)/.test(req.url())) return route.fulfill(json({ message: 'Unauthorized' }, 401));
        if (/\/users\/register/.test(req.url())) {
            const body = req.postDataJSON();
            registerBody = body;
            return route.fulfill(json({ message: 'Sign-up successful. Awaiting email verification.' }));
        }
        return route.fulfill(json([]));
    });
    let registerBody: any = null;

    // 0 — without an invite, signup is walled
    await page.goto('/signup');
    await expect(page.getByText('Invite Required')).toBeVisible({ timeout: 60_000 });
    expect(await page.context().cookies()).toEqual([]);
    await shot(page, '10-signup-no-invite-walled');

    // 1 — open invite link (as if scanned from QR) → cookie set
    await page.goto(`/signup?invite=${INVITE_TOKEN}&emailToken=em42`);
    await expect(page.getByText('Invite Required')).toHaveCount(0);
    await expect(page.locator('#username')).toBeVisible();
    const cookies = await page.context().cookies();
    const c = cookies.find((k) => k.name === 'kudos_invite');
    if (!c) throw new Error('kudos_invite cookie was not set');
    expect(JSON.parse(decodeURIComponent(c.value))).toEqual({ inviteToken: INVITE_TOKEN, emailToken: 'em42' });
    expect(c.sameSite).toBe('Lax');
    expect(c.expires - Date.now() / 1000).toBeGreaterThan(6 * 24 * 3600);
    await shot(page, '11-signup-with-invite-link');

    // 2 — wander off to browse the site, then to login
    await page.goto('/');
    await page.waitForTimeout(800);
    await page.goto('/login');
    await expect(page.getByText('You have a pending invite.')).toBeVisible();
    await shot(page, '12-login-pending-invite');
    await page.getByText('Finish signing up').click();

    // 3 — back on /signup with NO query string: form is usable thanks to the cookie
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByText('Invite Required')).toHaveCount(0);
    await expect(page.locator('#username')).toBeVisible();
    await shot(page, '13-signup-restored-from-cookie');

    // 4 — register: payload carries the cookie's tokens; cookie cleared after
    await page.locator('#username').fill('newbie');
    await page.locator('#email').fill('newbie@example.com');
    await page.locator('#password').fill('Secret123!');
    await page.locator('#confirmPassword').fill('Secret123!');
    await page.getByRole('checkbox', { name: /terms/i }).check();
    await page.getByRole('button', { name: /sign up|create account|register/i }).click();
    await expect.poll(() => registerBody, { timeout: 15_000 }).not.toBeNull();
    expect(registerBody).toMatchObject({ username: 'newbie', inviteToken: INVITE_TOKEN, emailToken: 'em42' });
    await expect.poll(async () => (await page.context().cookies()).some((k) => k.name === 'kudos_invite')).toBe(false);
    await shot(page, '14-registered-cookie-cleared');
});
