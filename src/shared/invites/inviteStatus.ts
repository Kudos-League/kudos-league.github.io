import type { UserInviteDTO } from '@/shared/api/types';

/** Turns whatever apiGet/apiMutate threw (usually string[]) into one message. */
export function inviteErrorMessage(err: unknown, fallback: string): string {
    if (Array.isArray(err) && err.length > 0) return String(err[0]);
    const anyErr = err as any;
    return anyErr?.response?.data?.message || anyErr?.message || fallback;
}

export const inviteMaxUses = (invite: UserInviteDTO) => invite.maxUses ?? 1;

/** Older rows have no counter; a set usedAt means their single use is gone. */
export const inviteUseCount = (invite: UserInviteDTO) =>
    invite.useCount ?? (invite.usedAt || invite.usedByUserID ? 1 : 0);

export const isInviteExhausted = (invite: UserInviteDTO) =>
    inviteUseCount(invite) >= inviteMaxUses(invite);

/** "Revoked", "Used", "Unused", or "3 / 25 joined" for shared links. */
export function inviteStatusLabel(invite: UserInviteDTO): string {
    const maxUses = inviteMaxUses(invite);
    const used = inviteUseCount(invite);
    if (maxUses > 1) {
        const counter = `${used} / ${maxUses} joined`;
        return invite.revoked ? `Revoked (${counter})` : counter;
    }
    if (invite.revoked) return 'Revoked';
    return used > 0 ? 'Used' : 'Unused';
}
