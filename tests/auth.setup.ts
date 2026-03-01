import path from 'path';
import fs from 'fs/promises';

import { test as setup, expect, request } from '@playwright/test';

const authFile = path.join(process.cwd(), 'playwright', '.auth', 'user.json');
const backendURI = process.env.PLAYWRIGHT_BACKEND_URI ?? 'http://localhost';
const authUsername = process.env.PLAYWRIGHT_AUTH_USERNAME;
const authPassword = process.env.PLAYWRIGHT_AUTH_PASSWORD;
const bootstrapUsername =
    process.env.PLAYWRIGHT_BOOTSTRAP_USERNAME ?? 'playwrightauth';
const bootstrapPassword =
    process.env.PLAYWRIGHT_BOOTSTRAP_PASSWORD ?? 'Playwright123!';
const bootstrapEmail =
    process.env.PLAYWRIGHT_BOOTSTRAP_EMAIL ?? `${bootstrapUsername}@example.com`;
const bootstrapInviteToken =
    process.env.PLAYWRIGHT_BOOTSTRAP_INVITE_TOKEN ?? 'x';

type SeedCred = { username: string; password: string };

const seedCandidates: SeedCred[] = [
    { username: 'user2', password: 'password2' },
    { username: 'user1', password: 'password1' },
    { username: 'user3', password: 'password3' },
    { username: 'alice', password: '123!' },
    { username: 'bob', password: '123!' },
    { username: 'test', password: 'test' },
    { username: 'admin', password: 'admin' },
    { username: 'admin2', password: 'admin2' },
    { username: 'admin2', password: 'Admin2Pass!23' }
];

const passwordDictionary = [
    'password1',
    'password2',
    'password3',
    'admin',
    'admin123!',
    'admin2',
    'Admin2Pass!23',
    'test',
    '123!',
    'demo1234'
];

async function discoverUsernames(baseURL: string) {
    const api = await request.newContext({ baseURL });
    const discovered = new Set<string>();

    try {
        for (const query of ['user', 'admin', 'test', 'alice', 'bob']) {
            const res = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
            if (!res.ok()) continue;

            const body = (await res.json()) as any;
            if (!Array.isArray(body)) continue;

            for (const item of body) {
                const username = item?.username;
                if (typeof username === 'string' && username.trim()) {
                    discovered.add(username.trim());
                }
            }
        }
    }
    finally {
        await api.dispose();
    }

    return Array.from(discovered).slice(0, 10);
}

function dynamicPasswordGuesses(username: string) {
    const normalized = username.trim();
    if (!normalized) return [];

    return [normalized, `${normalized}123`, `${normalized}123!`, 'password'];
}

setup('authenticate using seeded user and persist session', async ({
    page,
    context,
    baseURL
}) => {
    const candidates: SeedCred[] =
        authUsername && authPassword
            ? [{ username: authUsername, password: authPassword }]
            : seedCandidates;

    const api = await request.newContext({ baseURL: backendURI });
    let token: string | null = null;
    let username: string | null = null;
    const failures: string[] = [];

    for (const candidate of candidates) {
        const res = await api.post('/users/login', { data: candidate });

        if (!res.ok()) {
            failures.push(`${candidate.username}:${res.status()}`);
            continue;
        }

        const body = (await res.json()) as any;
        const maybeToken = body?.token;
        const maybeUsername = body?.user?.username ?? candidate.username;
        if (typeof maybeToken === 'string' && maybeToken.length > 0) {
            token = maybeToken;
            username = maybeUsername;
            break;
        }

        failures.push(`${candidate.username}:missing-token`);
    }

    await api.dispose();

    if (!token && !authUsername) {
        const discoveredUsernames = await discoverUsernames(backendURI);
        const discoveredCandidates: SeedCred[] = discoveredUsernames.flatMap(
            (username) => {
                const guesses = [
                    ...dynamicPasswordGuesses(username),
                    ...passwordDictionary
                ];

                return Array.from(new Set(guesses)).map((password) => ({
                    username,
                    password
                }));
            }
        );

        const retryApi = await request.newContext({ baseURL: backendURI });

        try {
            for (const candidate of discoveredCandidates) {
                const res = await retryApi.post('/users/login', {
                    data: candidate
                });

                if (!res.ok()) {
                    failures.push(`${candidate.username}:${res.status()}`);
                    continue;
                }

                const body = (await res.json()) as any;
                const maybeToken = body?.token;
                const maybeUsername =
                    body?.user?.username ?? candidate.username;
                if (
                    typeof maybeToken === 'string' &&
                    maybeToken.length > 0
                ) {
                    token = maybeToken;
                    username = maybeUsername;
                    break;
                }

                failures.push(`${candidate.username}:missing-token`);
            }
        }
        finally {
            await retryApi.dispose();
        }
    }

    if (!token && !authUsername) {
        const bootstrapApi = await request.newContext({ baseURL: backendURI });
        const bootstrapCred = {
            username: bootstrapUsername,
            password: bootstrapPassword
        };

        try {
            const registerRes = await bootstrapApi.post('/users/register', {
                data: {
                    username: bootstrapUsername,
                    email: bootstrapEmail,
                    password: bootstrapPassword,
                    inviteToken: bootstrapInviteToken
                }
            });

            if (registerRes.ok()) {
                const body = (await registerRes.json()) as any;
                const maybeToken = body?.token;
                if (typeof maybeToken === 'string' && maybeToken.length > 0) {
                    token = maybeToken;
                    username = body?.user?.username ?? bootstrapUsername;
                }
                else {
                    failures.push(`${bootstrapUsername}:register-missing-token`);
                }
            }
            else {
                failures.push(
                    `${bootstrapUsername}:register-${registerRes.status()}`
                );
            }

            if (!token) {
                const loginRes = await bootstrapApi.post('/users/login', {
                    data: bootstrapCred
                });

                if (loginRes.ok()) {
                    const body = (await loginRes.json()) as any;
                    const maybeToken = body?.token;
                    if (
                        typeof maybeToken === 'string' &&
                        maybeToken.length > 0
                    ) {
                        token = maybeToken;
                        username = body?.user?.username ?? bootstrapUsername;
                    }
                    else {
                        failures.push(`${bootstrapUsername}:login-missing-token`);
                    }
                }
                else {
                    failures.push(
                        `${bootstrapUsername}:login-${loginRes.status()}`
                    );
                }
            }
        }
        finally {
            await bootstrapApi.dispose();
        }
    }

    expect(
        token,
        `Could not log in with seeded users via ${backendURI}. Tried: ${failures.join(', ')}. ` +
            'Set PLAYWRIGHT_AUTH_USERNAME and PLAYWRIGHT_AUTH_PASSWORD to override. ' +
            'If needed, seed users from kudos-server first (recommended: yarn docker:init, destructive reset: yarn docker:seed1), ' +
            'or set PLAYWRIGHT_BOOTSTRAP_INVITE_TOKEN if your register flow requires a real invite token.'
    ).toBeTruthy();

    const appBaseURL = baseURL ?? 'http://localhost:3000';
    await page.goto(appBaseURL);
    const savedToken = token as string;
    const savedUsername = username ?? '';
    await page.evaluate(
        ({ nextToken, nextUsername }) => {
            localStorage.setItem(
                'web_auth_state',
                JSON.stringify({
                    token: nextToken,
                    username: nextUsername,
                    tokenTimestamp: Date.now()
                })
            );
        },
        { nextToken: savedToken, nextUsername: savedUsername }
    );

    await fs.mkdir(path.dirname(authFile), { recursive: true });
    await context.storageState({ path: authFile });
});
