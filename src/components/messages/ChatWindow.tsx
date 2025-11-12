import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ChannelDTO, MessageDTO, UserDTO } from '@/shared/api/types';
import MessageGroup from './MessageGroup';
import SlideInOnScroll from '../common/SlideInOnScroll';
import { groupMessagesByAuthor } from '@/shared/groupMessagesByAuthor';
import Button from '../common/Button';
import UserCard from '../users/UserCard';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
    user: UserDTO | null;
    channel: ChannelDTO | null;
    messages: MessageDTO[];
    onSend: (text: string, replyToId?: number) => void;
    onBack: () => void;
    isMobile?: boolean;
    onDelete?: (m: MessageDTO) => void;
    allowDelete?: boolean;
    allowEdit?: boolean;
    onEdit?: (id: number, content: string) => void;
    isLoading?: boolean;
}

// Helper function to sort messages chronologically
const sortMessages = (messages: MessageDTO[]): MessageDTO[] => {
    return [...messages].sort((a, b) => {
        // Sort by createdAt timestamp
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        
        if (timeA !== timeB) {
            return timeA - timeB; // Chronological order (oldest to newest)
        }
        // Fallback to ID if timestamps are equal
        return (a.id || 0) - (b.id || 0);
    });
};

const ChatWindow: React.FC<Props> = ({
    user,
    channel,
    messages,
    onSend,
    onBack,
    isMobile = false,
    onDelete,
    allowDelete,
    allowEdit,
    onEdit,
    isLoading = false
}) => {
    const [messageInput, setMessageInput] = useState('');
    const [replyTo, setReplyTo] = useState<MessageDTO | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Sort messages before grouping them
    const sortedMessages = useMemo(() => sortMessages(messages), [messages]);
    const groupedMessages = useMemo(
        () => groupMessagesByAuthor(sortedMessages),
        [sortedMessages]
    );

    // Create a map for finding messages by ID (for replies)
    const messageById = useMemo(() => {
        const map = new Map<number, MessageDTO>();
        sortedMessages.forEach(m => map.set(m.id, m));
        return map;
    }, [sortedMessages]);

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

    const handleSend = () => {
        if (!messageInput.trim()) return;
        onSend(messageInput.trim(), replyTo?.id);
        setMessageInput('');
        setReplyTo(null);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
        else if (e.key === 'Escape' && replyTo) {
            e.preventDefault();
            setReplyTo(null);
        }
    };

    const handleReply = (message: MessageDTO) => {
        setReplyTo(message);
        setEditingMessageId(null); // Cancel any ongoing edit
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleEditStart = (message: MessageDTO) => {
        if (!allowEdit || !user || user.id !== message.authorID) return;
        setEditingMessageId(message.id);
        setEditContent(message.content);
        setReplyTo(null); // Cancel any ongoing reply
    };

    const handleEditSave = (messageId: number) => {
        if (!editContent.trim() || !onEdit) return;
        onEdit(messageId, editContent.trim());
        setEditingMessageId(null);
        setEditContent('');
    };

    const handleEditCancel = () => {
        setEditingMessageId(null);
        setEditContent('');
    };

    const canEdit = (message: MessageDTO) => {
        return allowEdit && user && user.id === message.authorID && !message.deletedAt;
    };

    if (!channel) {
        return (
            <div className={`${
                isMobile ? 'w-full' : 'w-full'
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
        <div className='flex flex-col h-full w-full min-h-0'>
            {/* Header - Fixed at top */}
            <div className={`flex-shrink-0 flex items-center justify-between border-b bg-white dark:bg-zinc-900 ${
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
            </div>

            {/* Message list - Scrollable middle section */}
            <div className={`flex-1 overflow-y-auto bg-gray-50 dark:bg-zinc-800 ${
                isMobile ? 'p-3' : 'p-4'
            }`}>
                {isLoading ? (
                    <div className='flex flex-col items-center justify-center h-full text-gray-500'>
                        <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 dark:border-teal-400'></div>
                        <p className='text-sm text-gray-500 dark:text-gray-400 mt-3'>Loading messages...</p>
                    </div>
                ) : groupedMessages.length === 0 ? (
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
                                onReply={handleReply}
                                onDelete={onDelete}
                                canDelete={allowDelete ? (m) => !!user && user.id === m.authorID : undefined}
                                findMessageById={(id) => messageById.get(id)}
                                onEdit={allowEdit ? handleEditStart : undefined}
                                editingMessageId={editingMessageId}
                                editContent={editContent}
                                onEditChange={setEditContent}
                                onEditSave={handleEditSave}
                                onEditCancel={handleEditCancel}
                                canEdit={canEdit}
                            />
                        </SlideInOnScroll>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Message input - Fixed at bottom */}
            <div className={`flex-shrink-0 border-t bg-white dark:bg-zinc-900 ${
                isMobile ? 'p-4' : 'p-4'
            }`}>
                {/* Reply preview */}
                {replyTo && (
                    <div className='flex items-center justify-between mb-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-l-4 border-teal-500'>
                        <div className='flex-1 min-w-0'>
                            <p className='text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1'>
                                Replying to <UserCard triggerVariant='name' user={replyTo.author} />
                            </p>
                            <p className='text-sm text-zinc-600 dark:text-zinc-400 truncate'>
                                {replyTo.content}
                            </p>
                        </div>
                        <button
                            onClick={() => setReplyTo(null)}
                            className='ml-3 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            title='Cancel reply (Esc)'
                        >
                            <XMarkIcon className='w-5 h-5 text-zinc-500 dark:text-zinc-400' />
                        </button>
                    </div>
                )}
                
                <div className='flex gap-3'>
                    <input
                        ref={inputRef}
                        type='text'
                        placeholder={replyTo ? 'Type your reply...' : 'Type a message...'}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={isLoading}
                        className={`flex-1 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                            isMobile 
                                ? 'px-4 py-3 text-base' 
                                : 'px-3 py-2'
                        }`}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!messageInput.trim() || isLoading}
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
        </div>
    );
};

export default ChatWindow;