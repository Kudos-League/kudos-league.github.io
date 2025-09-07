import React from 'react';
import { MessageDTO } from '@/shared/api/types';
import MessageBubble from './MessageBubble';
import UserCard from '../users/UserCard';

interface MessageGroupProps {
    messages: MessageDTO[];
    isOwn?: boolean;
    compact?: boolean;
    isPublic?: boolean;
    onReply?: (m: MessageDTO) => void;
    onDelete?: (m: MessageDTO) => void;
    canDelete?: (m: MessageDTO) => boolean;
    findMessageById?: (id: number) => MessageDTO | undefined;
}

const MessageGroup: React.FC<MessageGroupProps> = ({
    messages,
    isOwn = false,
    compact = false,
    isPublic = false,
    onReply,
    onDelete,
    canDelete,
    findMessageById
}) => {
    if (messages.length === 0) return null;

    const author = messages[0].author;
    const authorName =
        isPublic && isOwn ? 'You' : author?.username || 'Anonymous';
    const AuthorCard = (
        <UserCard
            triggerVariant='name'
            user={{ ...author, username: authorName }}
        />
    );

    // TODO: Why is createdAt null???
    const createdAt = messages[0].createdAt
        ? new Date(messages[0].createdAt)
        : messages[0].updatedAt
            ? new Date(messages[0].updatedAt)
            : null;
    const timestamp =
        createdAt && !isNaN(createdAt.getTime())
            ? createdAt.toLocaleString()
            : 'Unknown time';

    // console.log('time', messages.map(m => m.createdAt), timestamp);

    return (
        <div className='mb-4'>
            {(!isOwn || isPublic) && (
                <div
                    className={`text-sm font-semibold mb-1 text-zinc-500 dark:text-zinc-400 ${
                        isOwn ? 'text-right mr-1' : 'text-left ml-1'
                    }`}
                >
                    {AuthorCard}
                </div>
            )}

            {messages.map((msg) => (
                <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={isOwn}
                    compact={compact}
                    onReply={onReply}
                    onDelete={onDelete}
                    canDelete={canDelete ? canDelete(msg) : false}
                    replyTo={
                        msg.replyToMessageID && findMessageById
                            ? findMessageById(msg.replyToMessageID) ?? null
                            : null
                    }
                />
            ))}

            <div
                className={`text-xs text-zinc-400 dark:text-zinc-500 opacity-70 mt-1 ${
                    isOwn ? 'text-right' : 'text-left'
                }`}
            >
                {timestamp}
            </div>
        </div>
    );
};

export default MessageGroup;
