import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ChannelDTO, MessageDTO, UserDTO } from '@/shared/api/types';
import MessageBubble from './MessageBubble';
import MessageGroup from './MessageGroup';
import { groupMessagesByAuthor } from '@/shared/groupMessagesByAuthor';
import Button from '../common/Button';

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
    const groupedMessages = useMemo(
        () => groupMessagesByAuthor(messages),
        [messages]
    );
    const [scrolledOnce, setScrolledOnce] = useState(false);

    useEffect(() => {
        if (!scrolledOnce && messages.length) {
            bottomRef.current?.scrollIntoView({ behavior: 'auto' });
            setScrolledOnce(true);
            return;
        }
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
                <Button
                    onClick={onBack}
                    className='text-blue-600 font-semibold text-sm'
                >
                    ← Back
                </Button>
                <h2 className='text-lg font-bold'>{otherUser?.username}</h2>
                <div className='w-16' /> {/* spacer */}
            </div>

            {/* Message list */}
            <div className='flex-1 overflow-y-auto p-4 bg-gray-50'>
                {groupedMessages.map((group) => (
                    <MessageGroup
                        key={group[0].id}
                        messages={group}
                        isOwn={!!user?.id && group[0].author?.id === user.id}
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
                <Button
                    onClick={() => {
                        if (!messageInput.trim()) return;
                        onSend(messageInput.trim());
                        setMessageInput('');
                    }}
                    className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                >
                    Send
                </Button>
            </div>
        </div>
    );
};

export default ChatWindow;
