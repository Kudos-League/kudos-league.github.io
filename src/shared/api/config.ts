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

export function getImagePath(avatarPath?: string | null): string | null {
    if (!avatarPath) return null;

    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
        return avatarPath;
    }

    return `${getEndpointUrl()}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
}
