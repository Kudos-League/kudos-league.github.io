import { generatePath } from 'react-router-dom';

type ParametricProxy = {
    [key: string]: string;
    [key: number]: string;
};

function makeParamProxy(pattern: string, param = 'id'): ParametricProxy {
    return new Proxy({} as ParametricProxy, {
        get(_target, prop) {
            if (typeof prop === 'symbol') return '' as unknown as string;
            const val = String(prop);
            return generatePath(pattern, { [param]: val });
        },
        has() {
            return true;
        },
        ownKeys() {
            return [];
        },
        getOwnPropertyDescriptor() {
            return { configurable: true, enumerable: false };
        }
    });
}

export function withQuery(
    path: string,
    query?: Record<string, string | number | boolean | null | undefined>
) {
    if (!query) return path;
    const qp = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
        if (v == null) continue;
        qp.set(k, String(v));
    }
    const qs = qp.toString();
    return qs ? `${path}?${qs}` : path;
}

export const routes = {
    home: '/' as const,
    about: '/about' as const,
    donate: '/donate' as const,
    result: '/result' as const,
    events: '/events' as const,
    createEvent: '/create-event' as const,
    createPost: '/create-post' as const,
    chat: '/chat' as const,
    dms: '/dms' as const,
    leaderboard: '/leaderboard' as const,
    admin: '/admin' as const,
    login: '/login' as const,
    signUp: '/sign-up' as const,
    forgotPassword: '/forgot-password' as const,
    resetPassword: '/reset-password' as const,

    user: makeParamProxy('/user/:id'),
    post: makeParamProxy('/post/:id'),
    event: makeParamProxy('/event/:id')
} as const;
