export enum Environment {
    LOCAL,
    DEV
}

const BACKEND_URI = process.env.REACT_APP_BACKEND_URI;
const WSS_URI = process.env.REACT_APP_WSS_URI;

const isHttps = BACKEND_URI.startsWith('https://');

if (!BACKEND_URI)
    throw new Error('Missing REACT_APP_BACKEND_URI at build time');
if (!WSS_URI) throw new Error('Missing REACT_APP_WSS_URI at build time');

export function getEndpointUrl(): string {
    return BACKEND_URI;
}

export function getWSSURL(): string {
    const base = isHttps ? WSS_URI.replace('ws://', 'wss://') : WSS_URI;
    const u = new URL('/socket.io', base);
    if (isHttps) u.port = '';
    return u.origin;
}

export function getImagePath(url?: string | null): string | null {
    if (!url) return null;

    if (url.startsWith('blob:') || url.startsWith('data:')) {
        return url;
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    const base = getEndpointUrl();
    const path = url.startsWith('/') ? url : `/${url}`;

    const final = `${base}${path}`;

    return final;
}
