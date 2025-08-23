import React from 'react';
import { MessageDTO } from '@/shared/api/types';

interface Props {
    message: MessageDTO;
    isOwn?: boolean;
    compact?: boolean;
}

const MessageBubble: React.FC<Props> = ({ message, isOwn = false }) => {
    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
            <div className={`max-w-md ${isOwn ? 'text-right' : 'text-left'}`}>
                <div
                    className={`px-4 py-3 rounded-xl text-sm whitespace-pre-wrap break-words shadow-sm transition-colors transform-gpu ${
                        isOwn
                            ? 'bg-teal-600 dark:bg-teal-500 text-white rounded-br-none'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-bl-none border border-zinc-300 dark:border-zinc-600'
                    }`}
                >
                    <p>{message.content}</p>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
