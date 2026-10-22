/**
 * Persists a pending invite (from `/signup?invite=…&emailToken=…`) in a
 * cookie so that a visitor who wanders off the registration page to look
 * around the site can come back and still register without re-opening the
 * invite link.
 */

export const INVITE_COOKIE_NAME = 'kudos_invite';
const INVITE_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export type PendingInvite = {
    inviteToken: string;
    emailToken?: string;
};

const canUseCookies = () =>
    typeof document !== 'undefined' && typeof document.cookie === 'string';

const cookieAttributes = (maxAge: number) => {
    const secure =
        typeof window !== 'undefined' && window.location.protocol === 'https:'
            ? '; Secure'
            : '';
    return `; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
};

export function savePendingInvite(invite: PendingInvite): void {
    if (!canUseCookies()) return;
    const token = invite.inviteToken.trim();
    if (!token) return;
    const value = encodeURIComponent(
        JSON.stringify({
            inviteToken: token,
            ...(invite.emailToken?.trim()
                ? { emailToken: invite.emailToken.trim() }
                : {})
        })
    );
    try {
        document.cookie = `${INVITE_COOKIE_NAME}=${value}${cookieAttributes(INVITE_COOKIE_MAX_AGE_SECONDS)}`;
    }
    catch {
        // Cookies disabled; the URL params still work for this page load.
    }
}

export function readPendingInvite(): PendingInvite | null {
    if (!canUseCookies()) return null;
    try {
        const entry = document.cookie
            .split(';')
            .map((part) => part.trim())
            .find((part) => part.startsWith(`${INVITE_COOKIE_NAME}=`));
        if (!entry) return null;
        const raw = decodeURIComponent(
            entry.slice(INVITE_COOKIE_NAME.length + 1)
        );
        const parsed = JSON.parse(raw);
        if (
            !parsed ||
            typeof parsed.inviteToken !== 'string' ||
            !parsed.inviteToken.trim()
        ) {
            return null;
        }
        return {
            inviteToken: parsed.inviteToken.trim(),
            emailToken:
                typeof parsed.emailToken === 'string' && parsed.emailToken.trim()
                    ? parsed.emailToken.trim()
                    : undefined
        };
    }
    catch {
        return null;
    }
}

export function clearPendingInvite(): void {
    if (!canUseCookies()) return;
    try {
        document.cookie = `${INVITE_COOKIE_NAME}=${cookieAttributes(0)}`;
    }
    catch {
        // ignore
    }
}
