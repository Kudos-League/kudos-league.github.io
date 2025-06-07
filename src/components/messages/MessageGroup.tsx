import React from 'react';
import { MessageDTO } from '@/shared/api/types';
import MessageBubble from './MessageBubble';

interface MessageGroupProps {
    messages: MessageDTO[];
    isOwn?: boolean;
    compact?: boolean;
    isPublic?: boolean;
}

const MessageGroup: React.FC<MessageGroupProps> = ({ messages, isOwn = false, compact = false, isPublic = false }) => {
    if (messages.length === 0) return null;

    const author = messages[0].author;
    const authorName =
        isPublic && isOwn
            ? 'You'
            : author?.username || 'Anonymous';

    // TODO: Why is createdAt null???
    const createdAt = messages[0].createdAt ? new Date(messages[0].createdAt) : messages[0].updatedAt ? new Date(messages[0].updatedAt) : null;
    const timestamp =
        createdAt && !isNaN(createdAt.getTime())
            ? createdAt.toLocaleString()
            : 'Unknown time';

    // console.log('time', messages.map(m => m.createdAt), timestamp);

    return (
        <div className='mb-4'>
            {(!isOwn || isPublic) && (
                <div
                    className={`text-sm text-gray-500 font-semibold mb-1 ${
                        isOwn ? 'text-right mr-1' : 'text-left ml-1'
                    }`}
                >
                    {authorName}
                </div>
            )}

            {messages.map((msg) => (
                <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={isOwn}
                    compact={compact}
                />
            ))}

            <div
                className={`text-xs text-gray-400 opacity-70 mt-1 ${
                    isOwn ? 'text-right' : 'text-left'
                }`}
            >
                {timestamp}
            </div>
        </div>
    );
};

export default MessageGroup;
