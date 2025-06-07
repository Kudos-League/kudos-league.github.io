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
                    className={`px-4 py-2 rounded-lg text-sm whitespace-pre-wrap break-words ${
                        isOwn
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                >
                    <p>{message.content}</p>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
