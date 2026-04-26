export function getEventReplyDescription(isEventCreator?: boolean) {
    return isEventCreator
        ? 'commented on your event'
        : 'commented on an event thread';
}

export function getEventReplyToastMessage({
    authorName,
    content,
    isEventCreator
}: {
    authorName: string;
    content?: string | null;
    isEventCreator?: boolean;
}) {
    const prefix = `${authorName} ${getEventReplyDescription(isEventCreator)}`;
    const text = content?.trim();

    return text ? `${prefix}: ${text}` : prefix;
}
