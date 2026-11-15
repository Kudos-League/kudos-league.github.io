import {
    inviteErrorMessage,
    inviteStatusLabel,
    isInviteExhausted
} from './inviteStatus';
import type { UserInviteDTO } from '@/shared/api/types';

const invite = (overrides: Partial<UserInviteDTO>): UserInviteDTO => ({
    id: 1,
    createdByUserID: 1,
    revoked: false,
    createdAt: '2026-11-15T00:00:00Z',
    updatedAt: '2026-11-15T00:00:00Z',
    ...overrides
});

describe('inviteStatus', () => {
    it('labels single-use invites', () => {
        expect(inviteStatusLabel(invite({}))).toBe('Unused');
        expect(inviteStatusLabel(invite({ useCount: 1, maxUses: 1 }))).toBe('Used');
        expect(inviteStatusLabel(invite({ revoked: true }))).toBe('Revoked');
    });

    it('treats legacy invites with usedAt but no counter as used', () => {
        const legacy = invite({ usedAt: '2026-10-01T00:00:00Z' });
        expect(inviteStatusLabel(legacy)).toBe('Used');
        expect(isInviteExhausted(legacy)).toBe(true);
    });

    it('shows a counter for shared links', () => {
        const shared = invite({ maxUses: 25, useCount: 3, usedAt: '2026-11-01T00:00:00Z' });
        expect(inviteStatusLabel(shared)).toBe('3 / 25 joined');
        expect(isInviteExhausted(shared)).toBe(false);
        expect(inviteStatusLabel({ ...shared, revoked: true })).toBe('Revoked (3 / 25 joined)');
        expect(isInviteExhausted({ ...shared, useCount: 25 })).toBe(true);
    });

    it('reads the first message from apiClient string[] errors', () => {
        expect(inviteErrorMessage(['Nope'], 'fallback')).toBe('Nope');
        expect(inviteErrorMessage({}, 'fallback')).toBe('fallback');
    });
});
