import type { Page, Route, Request } from '@playwright/test';

const ORIGIN = 'http://localhost:3000';
export const CORS = {
    'access-control-allow-origin': ORIGIN,
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers':
        'authorization, content-type, x-requested-with',
    'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    vary: 'Origin'
};

const E2E_JWT =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJpZCI6MSwidXNlcm5hbWUiOiJlMmUtdXNlciJ9.' +
    'sig';

export async function bootstrapAuth(page: Page, userId = 1) {
    const ctx = page.context();

    const user = {
        id: userId,
        email: 'e2e@example.com',
        username: 'e2e-user',
        kudos: 0,
        settings: {},
        tags: [],
        location: null,
        avatar: null,
        badges: []
    };

    await page.addInitScript(
        (args: (string | number)[]) => {
            const [key, token, now] = args as [string, string, number];
            localStorage.setItem(
                key,
                JSON.stringify({
                    token,
                    username: 'e2e-user',
                    tokenTimestamp: now
                })
            );
        },
        ['web_auth_state', E2E_JWT, Date.now()]
    );

    const json = (body: any) => ({
        status: 200,
        headers: { 'content-type': 'application/json', ...CORS },
        body: JSON.stringify(body)
    });

    await ctx.route('**/*', async (route: Route, req: Request) => {
        const rt = req.resourceType();
        const method = req.method();
        const url = req.url();

        if (!['xhr', 'fetch'].includes(rt) && method !== 'OPTIONS') {
            return route.continue();
        }

        if (method === 'OPTIONS') {
            return route.fulfill({ status: 204, headers: CORS });
        }

        if (method === 'PATCH' && /\/users\//.test(url)) {
            return route.continue();
        }

        if (/\/users\/me(\?|$)/.test(url)) return route.fulfill(json(user));
        if (new RegExp(`/users/${userId}(\\?|$)`).test(url))
            return route.fulfill(json(user));
        if (/\/users\/\d+(\?|$)/.test(url)) return route.fulfill(json(user));

        if (/\/notifications(\?|$)/.test(url)) return route.fulfill(json([]));
        if (/\/handshakes/.test(url)) return route.fulfill(json([]));
        if (/\/events/.test(url)) return route.fulfill(json([]));
        if (/\/posts/.test(url)) return route.fulfill(json([]));

        if (url.includes('/socket.io/'))
            return route.fulfill({ status: 204, headers: CORS });

        return route.fulfill(json({ ok: true, stub: true, url }));
    });
}
