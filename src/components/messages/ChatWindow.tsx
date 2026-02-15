import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChannelDTO, MessageDTO, UserDTO } from '@/shared/api/types';
import MessageGroup from './MessageGroup';
import SlideInOnScroll from '../common/SlideInOnScroll';
import { groupMessagesByAuthor } from '@/shared/groupMessagesByAuthor';
import Button from '../common/Button';
import UserCard from '../users/UserCard';
import AvatarComponent from '../users/Avatar';
import { getImagePath } from '@/shared/api/config';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useBlockedUsers } from '@/contexts/useBlockedUsers';

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
    hideHeader?: boolean;
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
    isLoading = false,
    hideHeader = false
}) => {
    const [messageInput, setMessageInput] = useState('');
    const [replyTo, setReplyTo] = useState<MessageDTO | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<number | null>(
        null
    );
    const [editContent, setEditContent] = useState('');

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const isEditingRef = useRef(false); // Track if we're currently editing
    const navigate = useNavigate();
    const { blockedUsers } = useBlockedUsers();

    // Sort messages before grouping them
    const sortedMessages = useMemo(() => sortMessages(messages), [messages]);
    const groupedMessages = useMemo(
        () => groupMessagesByAuthor(sortedMessages),
        [sortedMessages]
    );

    // Create a map for finding messages by ID (for replies)
    const messageById = useMemo(() => {
        const map = new Map<number, MessageDTO>();
        sortedMessages.forEach((m) => map.set(m.id, m));
        return map;
    }, [sortedMessages]);

    // Track if this is the first load of a channel
    const hasScrolledInitially = useRef<number | null>(null);

    useEffect(() => {
        // Only scroll to bottom if we're not editing a message
        if (bottomRef.current && !isEditingRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        // Reset the editing flag after scroll decision
        isEditingRef.current = false;
    }, [messages]);

    // Scroll to bottom when messages are first loaded for a channel
    useEffect(() => {
        if (bottomRef.current && channel && !isLoading && messages.length > 0) {
            // Check if this is a new channel or first load
            if (hasScrolledInitially.current !== channel.id) {
                hasScrolledInitially.current = channel.id;
                // Use a small timeout to ensure messages are fully rendered
                setTimeout(() => {
                    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
                }, 150);
            }
        }
    }, [channel?.id, isLoading, messages.length]);

    useEffect(() => {
        if (isMobile && channel && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isMobile, channel]);

    const handleSend = () => {
        if (!messageInput.trim()) return;

        // If editing, save the edit instead of sending a new message
        if (editingMessageId) {
            handleEditSave();
        }
        else {
            onSend(messageInput.trim(), replyTo?.id);
            setMessageInput('');
            setReplyTo(null);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
        else if (e.key === 'Escape') {
            e.preventDefault();
            if (editingMessageId) {
                handleEditCancel();
            }
            else if (replyTo) {
                setReplyTo(null);
            }
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
        setMessageInput(message.content); // Populate the input with message content
        setReplyTo(null); // Cancel any ongoing reply
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleEditSave = () => {
        if (!messageInput.trim() || !onEdit || !editingMessageId) return;
        isEditingRef.current = true; // Set flag to prevent auto-scroll
        onEdit(editingMessageId, messageInput.trim());
        setEditingMessageId(null);
        setEditContent('');
        setMessageInput('');
    };

    const handleEditCancel = () => {
        setEditingMessageId(null);
        setEditContent('');
        setMessageInput('');
    };

    const canEdit = (message: MessageDTO) => {
        return (
            allowEdit &&
            user &&
            user.id === message.authorID &&
            !message.deletedAt
        );
    };

    if (!channel) {
        return (
            <div
                className={`${
                    isMobile ? 'w-full' : 'w-full'
                } flex items-center justify-center text-gray-500 p-8`}
            >
                <div className='text-center'>
                    <p className={isMobile ? 'text-lg' : 'text-base'}>
                        {isMobile
                            ? 'Select a conversation to start chatting'
                            : 'Select a conversation to start chatting.'}
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
    const isBlocked =
        otherUser && blockedUsers ? blockedUsers.includes(otherUser.id) : false;

    return (
        <div className='flex flex-col h-full w-full min-h-0 overflow-hidden overflow-x-hidden'>
            {/* Header/Topbar */}
            {!hideHeader && (
                <div className='flex-shrink-0 flex items-center gap-3 border-b bg-white dark:bg-zinc-900 px-4 py-3'>
                    {/* Back button for mobile */}
                    {isMobile && (
                        <button
                            onClick={onBack}
                            className='w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 active:bg-zinc-200 dark:active:bg-zinc-600 transition-colors flex items-center justify-center group flex-shrink-0'
                            aria-label='Go back'
                        >
                            <ArrowLeftIcon className='w-4 h-4 text-brand-600 dark:text-brand-300 group-hover:text-brand-700 dark:group-hover:text-brand-200 transition-colors' />
                        </button>
                    )}

                    {/* User avatar - clickable to profile */}
                    {otherUser && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/user/${otherUser.id}`, {
                                    state: { fromConversation: true }
                                });
                            }}
                            className='hover:opacity-80 transition-opacity flex-shrink-0'
                            aria-label={`View ${otherUser.username}'s profile`}
                        >
                            <AvatarComponent
                                avatar={
                                    otherUser.avatar
                                        ? getImagePath(otherUser.avatar)
                                        : null
                                }
                                username={otherUser.username}
                                size={40}
                                pointer={true}
                            />
                        </button>
                    )}

                    {/* User name */}
                    <h2 className='font-bold text-lg flex-1 min-w-0'>
                        {otherUser ? (
                            <span className='text-zinc-900 dark:text-zinc-100 truncate block'>
                                {otherUser.username}
                            </span>
                        ) : (
                            <span>{channel?.name}</span>
                        )}
                    </h2>
                </div>
            )}

            {/* Main chat area */}
            <div className='flex flex-col flex-1 h-full min-h-0 overflow-hidden overflow-x-hidden'>
                {/* Message list - Scrollable middle section */}
                <div
                    className={`flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-zinc-800 ${
                        isMobile ? 'p-3' : 'p-4'
                    }`}
                >
                    {isLoading ? (
                        <div className='flex flex-col items-center justify-center h-full text-gray-500'>
                            <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 dark:border-teal-400'></div>
                            <p className='text-sm text-gray-500 dark:text-gray-400 mt-3'>
                                Loading messages...
                            </p>
                        </div>
                    ) : groupedMessages.length === 0 ? (
                        <div className='flex flex-col items-center justify-center h-full text-gray-500'>
                            <p
                                className={
                                    isMobile
                                        ? 'text-base text-center'
                                        : 'text-sm'
                                }
                            >
                                No messages yet. Start the conversation!
                            </p>
                        </div>
                    ) : (
                        groupedMessages.map((group, idx) => (
                            <SlideInOnScroll key={group[0].id} index={idx}>
                                <MessageGroup
                                    messages={group}
                                    isOwn={
                                        !!user?.id &&
                                        group[0].author?.id === user.id
                                    }
                                    onReply={handleReply}
                                    onDelete={onDelete}
                                    canDelete={
                                        allowDelete
                                            ? (m) =>
                                                !!user &&
                                                  user.id === m.authorID
                                            : undefined
                                    }
                                    findMessageById={(id) =>
                                        messageById.get(id)
                                    }
                                    onEdit={
                                        allowEdit ? handleEditStart : undefined
                                    }
                                    editingMessageId={editingMessageId}
                                    canEdit={canEdit}
                                />
                            </SlideInOnScroll>
                        ))
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Message input - Fixed at bottom */}
                <div
                    className={`flex-shrink-0 border-t bg-white dark:bg-zinc-900 ${
                        isMobile ? 'p-3' : 'p-4'
                    }`}
                >
                    {isBlocked ? (
                        <div className='flex items-center justify-center py-4'>
                            <p className='text-zinc-500 dark:text-zinc-400 text-sm'>
                                You have blocked this user. Unblock them to send
                                messages.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Edit preview */}
                            {editingMessageId && (
                                <div className='flex items-center justify-between mb-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-l-4 border-amber-500 dark:border-amber-400'>
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1'>
                                            Editing message
                                        </p>
                                        <p className='text-sm text-amber-600 dark:text-amber-400 truncate'>
                                            {editContent}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleEditCancel}
                                        className='ml-3 p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/30'
                                        title='Cancel edit (Esc)'
                                    >
                                        <XMarkIcon className='w-5 h-5 text-amber-600 dark:text-amber-400' />
                                    </button>
                                </div>
                            )}

                            {/* Reply preview */}
                            {replyTo && !editingMessageId && (
                                <div className='flex items-center justify-between mb-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-l-4 border-brand-600 dark:border-brand-300'>
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1'>
                                            Replying to{' '}
                                            <UserCard
                                                triggerVariant='name'
                                                user={replyTo.author}
                                            />
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

                            <div className='flex gap-2 items-center'>
                                <input
                                    ref={inputRef}
                                    type='text'
                                    placeholder={
                                        editingMessageId
                                            ? 'Edit your message...'
                                            : replyTo
                                                ? 'Type your reply...'
                                                : 'Type a message...'
                                    }
                                    value={messageInput}
                                    onChange={(e) =>
                                        setMessageInput(e.target.value)
                                    }
                                    onKeyDown={handleKeyPress}
                                    disabled={isLoading}
                                    className={`flex-1 min-w-0 border rounded focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-300 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                                        isMobile
                                            ? 'px-4 py-3 text-base'
                                            : 'px-3 py-2'
                                    }`}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!messageInput.trim() || isLoading}
                                    className={`flex-shrink-0 ${
                                        isMobile
                                            ? 'px-6 py-3 text-base font-medium'
                                            : 'px-4 py-2'
                                    }`}
                                >
                                    {editingMessageId ? 'Update' : 'Send'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
