import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ChannelDTO, MessageDTO, UserDTO } from '@/shared/api/types';
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
    onDelete?: (m: MessageDTO) => void;
    allowDelete?: boolean;
    allowEdit?: boolean;
    onEdit?: (id: number, content: string) => void;
}

const ChatWindow: React.FC<Props> = ({
    user,
    channel,
    messages,
    onSend,
    onBack,
    isMobile = false,
    onDelete,
    allowDelete
}) => {
    const [messageInput, setMessageInput] = useState('');
    const [headerHeight, setHeaderHeight] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerHeight, setContainerHeight] = useState<number | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const groupedMessages = useMemo(
        () => groupMessagesByAuthor(messages),
        [messages]
    );

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        if (isMobile && channel && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isMobile, channel]);


    const containerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
    };

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
                            Back
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    const otherUser = channel.users?.find((u) => u.id !== user?.id);

    return (
        <div ref={containerRef} style={containerStyle} className={`${isMobile ? 'w-full' : 'w-2/3'} flex flex-col flex-1 min-h-0`}>
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
                        {otherUser ? (
                            <UserCard user={otherUser} />
                        ) : (
                            <span>{channel.name}</span>
                        )}
                    </h2>
                </div>
                {!isMobile && (
                    <Button
                        onClick={onBack}
                        className='p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800'
                        variant='secondary'
                    >
                        <ArrowLeftIcon className='w-5 h-5' />
                    </Button>
                )}
            </div>

            {/* Message list */}
            <div style={{ flex: 1, minHeight: 0 }} className={`overflow-y-auto bg-gray-50 dark:bg-zinc-800 ${
                isMobile ? 'p-3' : 'p-4'
            }`}>
                {groupedMessages.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-full text-gray-500'>
                        <p className={isMobile ? 'text-base text-center' : 'text-sm'}>
                            No messages yet. Start the conversation!
                        </p>
                    </div>
                ) : (
                    groupedMessages.map((group, idx) => (
                        <SlideInOnScroll key={group[0].id} index={idx}>
                            <MessageGroup
                                messages={group}
                                isOwn={!!user?.id && group[0].author?.id === user.id}
                                onDelete={onDelete}
                                canDelete={allowDelete ? (m) => !!user && user.id === m.authorID : undefined}
                            />
                        </SlideInOnScroll>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Message input */}
            <div style={{ flexShrink: 0 }} className={`border-t bg-white dark:bg-zinc-900 flex gap-3 ${
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
