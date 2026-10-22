import {
    clearPendingInvite,
    INVITE_COOKIE_NAME,
    readPendingInvite,
    savePendingInvite
} from './inviteCookie';

describe('inviteCookie', () => {
    beforeEach(() => {
        clearPendingInvite();
    });

    it('returns null when no invite cookie is set', () => {
        expect(readPendingInvite()).toBeNull();
    });

    it('round-trips invite and email tokens', () => {
        savePendingInvite({ inviteToken: ' abc123 ', emailToken: 'em1' });
        expect(document.cookie).toContain(`${INVITE_COOKIE_NAME}=`);
        expect(readPendingInvite()).toEqual({
            inviteToken: 'abc123',
            emailToken: 'em1'
        });
    });

    it('omits emailToken when absent', () => {
        savePendingInvite({ inviteToken: 'abc' });
        expect(readPendingInvite()).toEqual({
            inviteToken: 'abc',
            emailToken: undefined
        });
    });

    it('ignores empty tokens', () => {
        savePendingInvite({ inviteToken: '   ' });
        expect(readPendingInvite()).toBeNull();
    });

    it('clears the cookie', () => {
        savePendingInvite({ inviteToken: 'abc' });
        clearPendingInvite();
        expect(readPendingInvite()).toBeNull();
    });

    it('survives malformed cookie values', () => {
        document.cookie = `${INVITE_COOKIE_NAME}=%7Bnot-json; Path=/`;
        expect(readPendingInvite()).toBeNull();
    });
});
