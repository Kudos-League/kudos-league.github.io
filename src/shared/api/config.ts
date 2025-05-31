export enum Environment {
    LOCAL,
    DEV
}

const BACKEND_URI = process.env.REACT_APP_BACKEND_URI ?? 'http://localhost';
const WSS_URI = process.env.REACT_APP_WSS_URI ?? 'ws://localhost:3001';

export function getEndpointUrl(): string {
    return BACKEND_URI;
}

export function getWSSURL(): string {
    const isHttps = BACKEND_URI.startsWith('https://');
    return isHttps ? WSS_URI.replace('ws://', 'wss://') : WSS_URI;
}

export function getImagePath(avatarPath?: string | null): string | null {
    if (!avatarPath) return null;

    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
        return avatarPath;
    }

    return `${getEndpointUrl()}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
}
