import type { MessageDTO } from "./api/types";

export const groupMessagesByAuthor = (messages: MessageDTO[]) => {
    const groups: MessageDTO[][] = [];
    let currentGroup: MessageDTO[] = [];

    for (let i = 0; i < messages.length; i++) {
        const current = messages[i];
        const prev = messages[i - 1];

        if (
            !prev ||
            current.author?.id !== prev.author?.id
        ) {
            if (currentGroup.length > 0) {
                groups.push(currentGroup);
            }
            currentGroup = [current];
        }
        else {
            currentGroup.push(current);
        }
    }

    if (currentGroup.length > 0) {
        groups.push(currentGroup);
    }

    return groups;
};
