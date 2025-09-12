import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ChannelDTO, MessageDTO, UserDTO } from '@/shared/api/types';
import MessageBubble from './MessageBubble';
import MessageGroup from './MessageGroup';
import SlideInOnScroll from '../common/SlideInOnScroll';
import { groupMessagesByAuthor } from '@/shared/groupMessagesByAuthor';
import Button from '../common/Button';
import UserCard from '../users/UserCard';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Props {
    user: UserDTO | null;
    channel: ChannelDTO | null;
    messages: MessageDTO[];
    onSend: (text: string) => void;
    onBack: () => void;
    isMobile?: boolean;
}

const ChatWindow: React.FC<Props> = ({
    user,
    channel,
    messages,
    onSend,
    onBack,
    isMobile = false
}) => {
    const [messageInput, setMessageInput] = useState('');

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const groupedMessages = useMemo(
        () => groupMessagesByAuthor(messages),
        [messages]
    );

    // Always scroll to bottom when messages change
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Auto-focus input on mobile when component mounts
    useEffect(() => {
        if (isMobile && channel && inputRef.current) {
            // Small delay to ensure proper rendering
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isMobile, channel]);

    const handleSend = () => {
        if (!messageInput.trim()) return;
        onSend(messageInput.trim());
        setMessageInput('');
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!channel) {
        return (
            <div className={`${
                isMobile ? 'w-full' : 'w-2/3'
            } flex items-center justify-center text-gray-500 p-8`}>
                <div className='text-center'>
                    <p className={isMobile ? 'text-lg' : 'text-base'}>
                        {isMobile ? 'Select a conversation to start chatting' : 'Select a conversation to start chatting.'}
                    </p>
                    {isMobile && (
                        <Button
                            onClick={onBack}
                            className='mt-4 px-6 py-2'
                            variant='secondary'
                        >
                            Back to Conversations
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    const otherUser = channel.users.find((u) => u.id !== user?.id);

    return (
        <div className={`${isMobile ? 'w-full' : 'w-2/3'} flex flex-col h-full`}>
            {/* Header */}
            <div className={`flex items-center justify-between border-b bg-white dark:bg-zinc-900 ${
                isMobile ? 'px-4 py-4' : 'px-4 py-3'
            }`}>
                <div className='flex items-center gap-3'>
                    {isMobile && (
                        <Button
                            onClick={onBack}
                            className='p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800'
                            variant='secondary'
                        >
                            <ArrowLeftIcon className='w-5 h-5' />
                        </Button>
                    )}
                    <h2 className={`font-bold ${isMobile ? 'text-lg' : 'text-lg'}`}>
                        <UserCard user={otherUser} />
                    </h2>
                </div>
                {!isMobile && (
                    <Button
                        onClick={onBack}
                        className='text-blue-600 font-semibold text-sm'
                    >
                        ← Back
                    </Button>
                )}
            </div>

            {/* Message list */}
            <div className={`flex-1 overflow-y-auto bg-gray-50 dark:bg-zinc-800 ${
                isMobile ? 'p-3' : 'p-4'
            }`}>
                {groupedMessages.length === 0 ? (
                    <div className='flex items-center justify-center h-full text-gray-500'>
                        <p className={isMobile ? 'text-base text-center' : 'text-sm'}>
                            No messages yet. Start the conversation!
                        </p>
                    </div>
                ) : (
                    groupedMessages.map((group, idx) => (
                        <SlideInOnScroll key={group[0].id} index={idx}>
                            <MessageGroup
                                messages={group}
                                isOwn={
                                    !!user?.id && group[0].author?.id === user.id
                                }
                            />
                        </SlideInOnScroll>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Message input */}
            <div className={`border-t bg-white dark:bg-zinc-900 flex gap-3 ${
                isMobile ? 'p-4' : 'p-4'
            }`}>
                <input
                    ref={inputRef}
                    type='text'
                    placeholder='Type a message...'
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className={`flex-1 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white ${
                        isMobile 
                            ? 'px-4 py-3 text-base' 
                            : 'px-3 py-2'
                    }`}
                />
                <Button
                    onClick={handleSend}
                    disabled={!messageInput.trim()}
                    className={`bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isMobile 
                            ? 'px-6 py-3 text-base font-medium' 
                            : 'px-4 py-2'
                    }`}
                >
                    Send
                </Button>
            </div>
        </div>
    );
};

export default ChatWindow;
