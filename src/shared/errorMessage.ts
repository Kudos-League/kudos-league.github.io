/**
 * Turn a caught API error into a user-facing message. `apiMutate` rejects with
 * the array of messages produced by extractApiErrors, so prefer those (they
 * carry the server's actual reason, e.g. the kudos cap) and fall back to a
 * caller-supplied default only when nothing usable is present.
 */
export function toErrorMessage(error: unknown, fallback: string): string {
    if (Array.isArray(error)) {
        const joined = error.filter(Boolean).map(String).join(' ');
        return joined.trim() || fallback;
    }
    if (typeof error === 'string' && error.trim()) return error;
    if (error && typeof error === 'object') {
        const msgs = (error as { __messages?: unknown }).__messages;
        if (Array.isArray(msgs) && msgs.length) {
            return msgs.filter(Boolean).map(String).join(' ') || fallback;
        }
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim()) return message;
    }
    return fallback;
}
