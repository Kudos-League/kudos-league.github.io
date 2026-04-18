export function getMessageReplyDescription(eventID?: number | null) {
    return eventID
        ? 'replied to your comment on an event'
        : 'replied to your message';
}

export function getMessageReplyTitle(eventID?: number | null) {
    return eventID ? 'Reply to your event comment' : 'Reply to your message';
}

export function getMessageReplyToastMessage({
    authorName,
    content,
    eventID
}: {
    authorName: string;
    content?: string | null;
    eventID?: number | null;
}) {
    const prefix = `${authorName} ${getMessageReplyDescription(eventID)}`;
    const text = content?.trim();

    return text ? `${prefix}: ${text}` : prefix;
}
