export type HandshakeStage = {
    status: string;
    senderID?: number;
    postSenderID?: number;
    itemReceiverID?: number;
    gifterID?: number;
    isSender: boolean;
    isParticipant: boolean;
    canAccept: boolean;
    canUndoAccept: boolean;
    canCancel: boolean;
    canComplete: boolean;
    postIsPast: boolean;
    userIsItemReceiver: boolean;
    otherUserID?: number;
};

export function getHandshakeStage(
    handshake: any,
    currentUserId?: number
): HandshakeStage {
    const status = handshake?.status || 'new';

    const toNumber = (v: any): number | undefined => {
        if (v === undefined || v === null) return undefined;
        const n = Number(v);
        return Number.isNaN(n) ? undefined : n;
    };

    const senderID =
        toNumber(handshake?.senderID) ??
        toNumber(handshake?.sender?.id) ??
        toNumber(handshake?.sender?.ID) ??
        toNumber(handshake?.sender);
    const postSenderID =
        toNumber(handshake?.post?.senderID) ??
        toNumber(handshake?.post?.sender?.id) ??
        toNumber(handshake?.post?.sender?.ID) ??
        toNumber(handshake?.post?.sender);
    const receiverID =
        toNumber(handshake?.receiverID) ??
        toNumber(handshake?.receiverId) ??
        toNumber(handshake?.receiver?.id) ??
        toNumber(handshake?.receiver?.ID) ??
        toNumber(handshake?.receiver);

    const itemReceiverID =
        handshake?.post?.type === 'gift' ? senderID : postSenderID;

    const gifterID = handshake?.post?.type === 'gift' ? postSenderID : senderID;

    const isSender = currentUserId !== undefined && senderID === currentUserId;
    const isParticipant =
        currentUserId !== undefined &&
        ((senderID !== undefined && senderID === currentUserId) ||
            (postSenderID !== undefined && postSenderID === currentUserId) ||
            (receiverID !== undefined && receiverID === currentUserId));

    const postIsPast = !!handshake?.post?.isPast;

    const canAccept = (() => {
        // Only the post creator (User A) can accept, regardless of gift or request type
        return (
            !postIsPast &&
            status === 'new' &&
            postSenderID !== undefined &&
            currentUserId !== undefined &&
            postSenderID === currentUserId
        );
    })();

    const userIsItemReceiver =
        currentUserId !== undefined &&
        itemReceiverID !== undefined &&
        currentUserId === itemReceiverID;
    const canCancel =
        !postIsPast &&
        status !== 'cancelled' &&
        status !== 'completed' &&
        currentUserId !== undefined &&
        ((senderID !== undefined && senderID === currentUserId) ||
            (postSenderID !== undefined && postSenderID === currentUserId) ||
            (receiverID !== undefined && receiverID === currentUserId));

    const canUndoAccept = (() => {
        if (postIsPast) return false;
        if (!handshake?.post?.type || currentUserId === undefined) return false;
        // The acceptor is always the post creator (User A), regardless of gift or request
        return (
            status === 'accepted' &&
            postSenderID !== undefined &&
            postSenderID === currentUserId
        );
    })();

    const canComplete = (() => {
        if (status !== 'accepted') return false;
        if (!handshake?.post?.type || currentUserId === undefined) return false;
        // Only the item receiver can complete the exchange and give kudos
        // For requests: post creator receives the item (can complete)
        // For gifts: sender receives the item (can complete)
        return currentUserId === itemReceiverID;
    })();

    let otherUserID: number | undefined;
    if (currentUserId !== undefined) {
        if (senderID !== undefined && senderID === currentUserId)
            otherUserID = postSenderID;
        else otherUserID = senderID ?? receiverID;
    }

    return {
        status,
        senderID,
        postSenderID,
        itemReceiverID,
        gifterID,
        isSender,
        isParticipant,
        canAccept,
        canUndoAccept,
        canCancel,
        postIsPast,
        userIsItemReceiver,
        otherUserID,
        canComplete
    };
}
