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
    userIsItemReceiver: boolean;
    otherUserID?: number;
};

export function getHandshakeStage(handshake: any, currentUserId?: number): HandshakeStage {
    const status = handshake?.status || 'new';

    const toNumber = (v: any): number | undefined => {
        if (v === undefined || v === null) return undefined;
        const n = Number(v);
        return Number.isNaN(n) ? undefined : n;
    };

    const senderID = toNumber(handshake?.senderID) ?? toNumber(handshake?.sender?.id) ?? toNumber(handshake?.sender?.ID) ?? toNumber(handshake?.sender);
    const postSenderID =
        toNumber(handshake?.post?.senderID) ?? toNumber(handshake?.post?.sender?.id) ?? toNumber(handshake?.post?.sender?.ID) ?? toNumber(handshake?.post?.sender);
    const receiverID =
        toNumber(handshake?.receiverID) ?? toNumber(handshake?.receiverId) ?? toNumber(handshake?.receiver?.id) ?? toNumber(handshake?.receiver?.ID) ?? toNumber(handshake?.receiver);

    const itemReceiverID = handshake?.post?.type === 'gift' ? senderID : postSenderID;

    const gifterID = handshake?.post?.type === 'gift' ? postSenderID : senderID;

    const isSender = currentUserId !== undefined && senderID === currentUserId;
    const isParticipant = currentUserId !== undefined && (
        (senderID !== undefined && senderID === currentUserId) ||
        (postSenderID !== undefined && postSenderID === currentUserId) ||
        (receiverID !== undefined && receiverID === currentUserId)
    );

    const canAccept = status === 'new' && postSenderID !== undefined && currentUserId !== undefined && postSenderID === currentUserId;
    const userIsItemReceiver = currentUserId !== undefined && itemReceiverID !== undefined && currentUserId === itemReceiverID;

    const canUndoAccept = (() => {
        if (!handshake?.post?.type || currentUserId === undefined) return false;
        if (handshake.post.type === 'request') {
            return postSenderID !== undefined && postSenderID === currentUserId;
        }
        if (handshake.post.type === 'gift') {
            return receiverID !== undefined && receiverID === currentUserId;
        }
        return false;
    })();

    let otherUserID: number | undefined;
    if (currentUserId !== undefined) {
        if (senderID !== undefined && senderID === currentUserId) otherUserID = postSenderID;
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
        userIsItemReceiver,
        otherUserID
    };
}
