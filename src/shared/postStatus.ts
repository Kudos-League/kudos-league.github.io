import type { GiftType, HandshakeDTO } from '@/shared/api/types';

type PostStatusLike = {
    status?: string | null;
    type?: string | null;
    giftType?: GiftType | null;
    handshakes?: HandshakeDTO[] | null;
};

export function isDigitalGiftPost(post?: PostStatusLike | null): boolean {
    return post?.type === 'gift' && post?.giftType === 'digital';
}

export function isPostEffectivelyClosed(post?: PostStatusLike | null): boolean {
    if (!post?.status) return false;
    if (post.status === 'closed') return true;

    return post.status === 'offer_posted' && !isDigitalGiftPost(post);
}

export function hasUserGivenDigitalKudos(
    post: PostStatusLike | null | undefined,
    userID?: number
): boolean {
    if (!userID || !isDigitalGiftPost(post)) return false;

    return (post?.handshakes ?? []).some(
        (handshake) =>
            handshake.senderID === userID && handshake.status !== 'cancelled'
    );
}
