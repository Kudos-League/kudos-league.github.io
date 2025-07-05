import React, { useState, useMemo } from 'react';
import { CreateMessageDTO, MessageDTO } from '@/shared/api/types';
import { sendMessage } from '@/shared/api/actions';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector } from 'redux_store/hooks';

interface Props {
    messages: MessageDTO[];
    title?: string;
    callback?: (data: any) => void;
    postID?: number;
    showSendMessage?: boolean;
}

const MessageList: React.FC<Props> = ({
    messages,
    title,
    callback,
    postID,
    showSendMessage
}) => {
    const { user } = useAuth();
    const token = useAppSelector((state) => state.auth.token);
    const [showAllMessages, setShowAllMessages] = useState(false);
    const [messageContent, setMessageContent] = useState('');

    // Simple processing - just sort by ID
    const processedMessages = useMemo(() => {
        if (!messages || messages.length === 0) return [];
        
        return [...messages].sort((a, b) => a.id - b.id);
    }, [messages]);

    const handleSubmitMessage = async () => {
        if (!messageContent.trim() || !user || !token || !postID) return;

        const newMessage: CreateMessageDTO = {
            content: messageContent,
            authorID: user.id,
            postID
        };

        try {
            const response = await sendMessage(newMessage, token);
            callback?.(response);
            setMessageContent('');
        }
        catch (err) {
            console.error('Send failed:', err);
        }
    };

    // Simple Message Component without dates
    const renderMessage = (msg: MessageDTO) => (
        <div key={msg.id} className="border-b border-gray-200 py-3 last:border-b-0">
            <div className="mb-2">
                <span className="font-semibold text-gray-900">
                    {msg.author?.username || `User ${msg.authorID}`}
                </span>
            </div>
            
            {/* Message content */}
            <div className="text-gray-800 whitespace-pre-wrap">
                {msg.content}
            </div>
        </div>
    );

    const displayedMessages = showAllMessages ? processedMessages : processedMessages.slice(0, 3);
    const hasMoreMessages = processedMessages.length > 3;

    return (
        <div>
            {title && (
                <div className="mb-3">
                    <h2 className='text-lg font-bold'>{title}</h2>
                </div>
            )}

            <div className='max-h-72 overflow-y-auto mb-3'>
                {processedMessages.length === 0 && (
                    <p className='text-red-500 text-sm mb-2'>No comments yet</p>
                )}
                
                {displayedMessages.map(renderMessage)}
            </div>

            {showSendMessage && (
                <div className='flex border-t pt-3 items-center gap-2'>
                    <input
                        type='text'
                        placeholder='Type a message...'
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSubmitMessage();
                            }
                        }}
                        className='flex-1 px-3 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    <button
                        onClick={handleSubmitMessage}
                        disabled={!messageContent.trim()}
                        className='bg-blue-600 text-white px-3 py-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    >
                        ➤
                    </button>
                </div>
            )}

            {hasMoreMessages && !showAllMessages && (
                <div className="flex justify-between items-center mt-3">
                    <button
                        onClick={() => setShowAllMessages(true)}
                        className='px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors'
                    >
                        Show more messages ({processedMessages.length - 3} more)
                    </button>
                    
                    <span className="text-xs text-gray-500">
                        {processedMessages.length} message{processedMessages.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {showAllMessages && hasMoreMessages && (
                <button
                    onClick={() => setShowAllMessages(false)}
                    className='mt-3 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors w-full'
                >
                    Show less
                </button>
            )}
        </div>
    );
};

export default MessageList;