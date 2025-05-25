import React, { useRef, useEffect, useState } from 'react';
import { ChannelDTO, MessageDTO, UserDTO } from '@/shared/api/types';
import MessageBubble from './MessageBubble';

interface Props {
    user: UserDTO | null;
    channel: ChannelDTO | null;
    messages: MessageDTO[];
    onSend: (text: string) => void;
    onBack: () => void;
}

const ChatWindow: React.FC<Props> = ({
    user,
    channel,
    messages,
    onSend,
    onBack
}) => {
    const [messageInput, setMessageInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!channel) {
        return (
            <div className='flex-1 flex items-center justify-center text-gray-500'>
                Select a conversation to start chatting.
            </div>
        );
    }

    const otherUser = channel.users.find((u) => u.id !== user?.id);

    return (
        <div className='w-2/3 flex flex-col h-full'>
            {/* Header */}
            <div className='flex items-center justify-between px-4 py-3 border-b bg-white'>
                <button
                    onClick={onBack}
                    className='text-blue-600 font-semibold text-sm'
                >
                    ← Back
                </button>
                <h2 className='text-lg font-bold'>{otherUser?.username}</h2>
                <div className='w-16' /> {/* spacer */}
            </div>

            {/* Message list */}
            <div className='flex-1 overflow-y-auto p-4 bg-gray-50'>
                {messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={msg.author?.id === user?.id}
                    />
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Message input */}
            <div className='p-4 border-t bg-white flex gap-3'>
                <input
                    type='text'
                    placeholder='Type a message...'
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className='flex-1 px-3 py-2 border rounded'
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (messageInput) {
                                onSend(messageInput.trim());
                            }
                            setMessageInput('');
                        }
                    }}
                />
                <button
                    onClick={() => {
                        if (!messageInput.trim()) return;
                        onSend(messageInput.trim());
                        setMessageInput('');
                    }}
                    className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;
