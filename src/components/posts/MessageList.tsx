import React, { useState, useMemo, useRef, useCallback } from 'react';
import { CreateMessageDTO, MessageDTO } from '@/shared/api/types';
import {
    useSendMessage,
    useUpdateMessage,
    useDeleteMessage
} from '@/shared/api/mutations/messages';
import { useAuth } from '@/contexts/useAuth';
import { useAppSelector } from 'redux_store/hooks';
import Button from '../common/Button';
import UserCard from '../users/UserCard';
import TextWithLinks from '../common/TextWithLinks';
import RichEmbeds from '../common/RichEmbeds';
import {
    ArrowUturnLeftIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

interface Props {
    messages: MessageDTO[];
    title?: string;
    callback?: (data: any) => void;
    onMessageUpdate?: (updatedMessage: MessageDTO) => void;
    onMessageDelete?: (deletedMessageId: number) => void;
    postID?: number;
    showSendMessage?: boolean;
    allowEdit?: boolean;
    allowDelete?: boolean;
    eventID?: number;
    active?: boolean;
}

// CONSTANT FOR COLLAPSIBLE CONTENT
const MAX_COMMENT_HEIGHT = '100px';
const MAX_COMMENT_LINES = 5; // A visual guideline, not strictly enforced by this CSS method

// Helper to get display name (prioritize displayName, fallback to name or username)
const getDisplayName = (user: any) => {
    return user?.displayName || user?.name || user?.username || 'Unknown';
};

/**
 * Helper function to format the time as "x time ago" (relative time).
 */
const formatTimeAgo = (date: Date): string => {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) return 'Unknown time';

        const seconds = Math.floor(
            (new Date().getTime() - dateObj.getTime()) / 1000
        );

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' years ago';

        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' months ago';

        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' days ago';

        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' hours ago';

        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutes ago';

        // Show 'Just now' or '1 second ago' for very recent posts
        return seconds < 10 ? 'Just now' : Math.floor(seconds) + ' seconds ago';
    }
    catch (e) {
        return 'Unknown time';
    }
};

const MessageList: React.FC<Props> = ({
    messages,
    title,
    callback,
    onMessageUpdate,
    onMessageDelete,
    postID,
    showSendMessage,
    allowEdit = false,
    allowDelete = false,
    eventID,
    active = true
}) => {
    const { user } = useAuth();
    const token = useAppSelector((state) => state.auth.token);
    const sendMessageMutation = useSendMessage(postID as number | undefined);
    const updateMessageMutation = useUpdateMessage();
    const deleteMessageMutation = useDeleteMessage();
    const [showAllMessages, setShowAllMessages] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<number | null>(
        null
    );
    const [editContent, setEditContent] = useState('');
    const [replyTo, setReplyTo] = useState<MessageDTO | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
    // Use HTMLTextAreaElement instead of HTMLInputElement for the ref
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Helper function to auto-adjust textarea height
    const adjustTextareaHeight = useCallback(
        (textarea: HTMLTextAreaElement | null) => {
            if (!textarea) return;
            textarea.style.height = '42px';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = Math.min(scrollHeight, 200) + 'px';
        },
        []
    );

    // State to manage which messages are expanded (for the "show more" feature)
    const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
        new Set()
    );

    // Sorting messages by creation date (newest first)
    const processedMessages = useMemo(() => {
        if (!messages || messages.length === 0) return [];

        return [...messages].sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
        );
    }, [messages]);

    const handleSubmitMessage = async () => {
        if (!messageContent.trim() || !user || !token || (!postID && !eventID))
            return;

        const newMessage: CreateMessageDTO = {
            content: messageContent,
            authorID: user.id,
            ...(postID ? { postID } : {}),
            ...(eventID ? { eventID } : {}),
            ...(replyTo?.id ? { replyToMessageID: replyTo.id } : {})
        };

        try {
            const response = await sendMessageMutation.mutateAsync(
                newMessage as any
            );
            const enriched: MessageDTO = {
                ...response,
                author: response.author || user || undefined,
                authorID: response.authorID ?? user.id ?? response.author?.id
            } as MessageDTO;
            callback?.(enriched);
            setMessageContent('');
            setReplyTo(null);
            // Reset textarea height after message is sent
            if (inputRef.current) {
                inputRef.current.style.height = '42px';
            }
        }
        catch (err) {
            console.error('Failed to send message:', err);
            alert('Failed to send message. Please try again.');
        }
    };

    const handleEditStart = (message: MessageDTO) => {
        setEditingMessageId(message.id);
        setEditContent(message.content);
    };

    const handleEditSave = async (messageId: number) => {
        if (!editContent.trim() || !token) return;

        const originalMessage = processedMessages.find(
            (msg) => msg.id === messageId
        );
        if (!originalMessage) return;

        try {
            const response = await updateMessageMutation.mutateAsync({
                id: messageId,
                content: editContent
            });

            const updatedMessage: MessageDTO = {
                ...response,
                author: response.author || originalMessage.author
            };

            if (onMessageUpdate) {
                onMessageUpdate(updatedMessage);
            }
            else {
                callback?.(updatedMessage);
            }

            setEditingMessageId(null);
            setEditContent('');
        }
        catch (err) {
            console.error('Failed to update message:', err);
            alert('Failed to update message. Please try again.');
        }
    };

    const handleEditCancel = () => {
        setEditingMessageId(null);
        setEditContent('');
    };

    const handleDeleteClick = (messageId: number) => {
        setMessageToDelete(messageId);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!token || !messageToDelete) return;

        try {
            await deleteMessageMutation.mutateAsync(messageToDelete);

            const original = processedMessages.find(
                (m) => m.id === messageToDelete
            );
            if (!original) {
                onMessageDelete?.(messageToDelete);
                callback?.({ type: 'delete', messageId: messageToDelete });
                setShowDeleteModal(false);
                setMessageToDelete(null);
                return;
            }

            const enriched: MessageDTO = {
                ...original,
                deletedAt: new Date().toISOString()
            };

            if (onMessageUpdate) {
                onMessageUpdate(enriched);
            }
            else {
                callback?.(enriched);
            }

            onMessageDelete?.(messageToDelete);
        }
        catch (err) {
            console.error('Failed to delete message:', err);
            alert('Failed to delete message. Please try again.');
        }
        finally {
            setShowDeleteModal(false);
            setMessageToDelete(null);
        }
    };

    const canEditMessage = (message: MessageDTO) => {
        return allowEdit && user && user.id === message.authorID;
    };

    const canDeleteMessage = (message: MessageDTO) => {
        return allowDelete && user && user.id === message.authorID;
    };

    const byId = useMemo(() => {
        const map = new Map<number, MessageDTO>();
        for (const m of processedMessages) map.set(m.id, m);
        return map;
    }, [processedMessages]);

    // --- New Toggle Function ---
    const toggleExpansion = (messageId: number) => {
        setExpandedMessages((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(messageId)) {
                newSet.delete(messageId);
            }
            else {
                newSet.add(messageId);
            }
            return newSet;
        });
    };

    // --- Message Content Ref/Tracker ---
    const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    const renderMessage = (msg: MessageDTO) => {
        const isEditing = editingMessageId === msg.id;
        const showEditButton = canEditMessage(msg);
        const showDeleteButton = canDeleteMessage(msg);
        const timestamp = formatTimeAgo(msg.createdAt);

        const isExpanded = expandedMessages.has(msg.id);

        // This is a simple heuristic: if the message has more than 200 characters, we assume it's long enough to need collapsing.
        const requiresCollapseHeuristic =
            msg.content.length > 200 ||
            msg.content.split('\n').length > MAX_COMMENT_LINES;

        const contentRef = (el: HTMLDivElement) => {
            if (el) {
                messageRefs.current.set(msg.id, el);
            }
            else {
                messageRefs.current.delete(msg.id);
            }
        };

        return (
            <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className='border-t border-zinc-200 dark:border-zinc-700 py-3 first:border-t-0'
            >
                <div className='mb-2 flex justify-between items-start'>
                    <span className='font-semibold text-zinc-900 dark:text-zinc-100'>
                        <UserCard user={msg.author} />
                    </span>

                    {/* Action buttons */}
                    <div className='flex gap-1'>
                        {!isEditing && (
                            <button
                                type='button'
                                title='Reply'
                                onClick={() => {
                                    setReplyTo(msg);
                                    setTimeout(
                                        () => inputRef.current?.focus(),
                                        0
                                    );
                                }}
                                className='p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            >
                                <ArrowUturnLeftIcon className='w-5 h-5 text-zinc-700 dark:text-zinc-200' />
                            </button>
                        )}
                        {(showEditButton || showDeleteButton) && !isEditing && (
                            <>
                                {showEditButton && (
                                    <button
                                        type='button'
                                        title='Edit'
                                        onClick={() => handleEditStart(msg)}
                                        className='p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    >
                                        <PencilIcon className='w-5 h-5 text-zinc-700 dark:text-zinc-200' />
                                    </button>
                                )}
                                {showDeleteButton && (
                                    <button
                                        type='button'
                                        title='Delete'
                                        onClick={() =>
                                            handleDeleteClick(msg.id)
                                        }
                                        className='p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    >
                                        <TrashIcon className='w-5 h-5 text-red-600 dark:text-red-400' />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Display Relative Time */}
                <span className='text-xs text-zinc-500 dark:text-zinc-400 block mb-2'>
                    {timestamp}
                </span>

                {/* Reply preview - WhatsApp style */}
                {msg.replyToMessageID && (
                    <div className='mb-2 ml-1'>
                        <button
                            type='button'
                            onClick={() => {
                                const tryScroll = () => {
                                    const el = document.getElementById(
                                        `msg-${msg.replyToMessageID}`
                                    );
                                    if (el) {
                                        el.scrollIntoView({
                                            behavior: 'smooth',
                                            block: 'center'
                                        });
                                        el.classList.add(
                                            'ring-2',
                                            'ring-brand-400'
                                        );
                                        setTimeout(() => {
                                            el.classList.remove(
                                                'ring-2',
                                                'ring-brand-400'
                                            );
                                        }, 1200);
                                        return true;
                                    }
                                    return false;
                                };
                                if (!tryScroll()) {
                                    setShowAllMessages(true);
                                    setTimeout(() => {
                                        tryScroll();
                                    }, 50);
                                }
                            }}
                            className='block w-full text-left px-2 py-1.5 rounded-lg border-l-4 border-brand-600 dark:border-brand-300 bg-gray-100 dark:bg-zinc-700'
                        >
                            <div className='text-xs font-semibold mb-0.5 text-brand-600 dark:text-brand-300'>
                                <UserCard
                                    triggerVariant='name'
                                    user={
                                        byId.get(msg.replyToMessageID)?.author
                                    }
                                />
                            </div>
                            <div className='text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2'>
                                {byId.get(msg.replyToMessageID)?.content ??
                                    'Original message'}
                            </div>
                        </button>
                    </div>
                )}

                {/* Message content or edit form */}
                {isEditing ? (
                    <div className='space-y-2'>
                        <textarea
                            value={editContent}
                            onChange={(e) => {
                                setEditContent(e.target.value);
                            }}
                            className='w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            style={{
                                minHeight: '80px',
                                height: '80px',
                                overflow: 'hidden'
                            }}
                            rows={3}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                    e.preventDefault();
                                    handleEditSave(msg.id);
                                }
                                else if (e.key === 'Escape') {
                                    handleEditCancel();
                                }
                            }}
                        />
                        <div className='flex gap-2'>
                            <Button
                                onClick={() => handleEditSave(msg.id)}
                                disabled={!editContent.trim()}
                                className='text-xs'
                            >
                                Save
                            </Button>
                            <Button
                                onClick={handleEditCancel}
                                variant='secondary'
                                className='text-xs'
                            >
                                Cancel
                            </Button>
                        </div>
                        <p className='text-xs text-gray-500'>
                            Press Ctrl+Enter to save, Esc to cancel
                        </p>
                    </div>
                ) : (
                    <>
                        <div
                            ref={contentRef}
                            className='relative transition-max-height duration-300 ease-in-out'
                            style={{
                                maxHeight: isExpanded
                                    ? 'none'
                                    : MAX_COMMENT_HEIGHT,
                                overflow: 'hidden'
                            }}
                        >
                            <TextWithLinks className='text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap'>
                                {msg.content}
                            </TextWithLinks>

                            {/* Gradient Overlay for collapsed state */}
                            {!isExpanded && requiresCollapseHeuristic && (
                                <div className='absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none' />
                            )}
                        </div>

                        {!msg.deletedAt && (
                            <RichEmbeds text={msg.content} className='mt-2' />
                        )}

                        {requiresCollapseHeuristic && (
                            <button
                                onClick={() => toggleExpansion(msg.id)}
                                className='mt-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none'
                            >
                                {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                        )}
                    </>
                )}
            </div>
        );
    };

    const displayedMessages = showAllMessages
        ? processedMessages
        : processedMessages.slice(0, 3); // Show first 3 messages (newest)
    const hasMoreMessages = processedMessages.length > 3;

    return (
        <div>
            {title && (
                <div className='mb-3'>
                    <h2 className='text-lg font-bold'>{title}</h2>
                </div>
            )}

            <div className='max-h-72 mb-3 relative'>
                {processedMessages.length === 0 && (
                    <p className='text-red-500 text-sm mb-2 pb-2'>
                        No comments yet
                    </p>
                )}

                {displayedMessages.map(renderMessage)}

                {/* Should be sticky at the bottom*/}
                <div className='sticky bottom-0 bg-white dark:bg-gray-900 pt-2 pb-1'>
                    {/* Gradient fade at the top for smoother transition */}
                    <div className='absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-gray-900/50 dark:to-gray-900 pointer-events-none -mt-6' />

                    {hasMoreMessages && (
                        <div className='z-10 bg-white dark:bg-gray-800 pb-2 mb-2 border-b border-zinc-200 dark:border-zinc-700'>
                            <Button
                                onClick={() =>
                                    setShowAllMessages(!showAllMessages)
                                }
                                variant='secondary'
                                className='w-full'
                            >
                                {showAllMessages
                                    ? 'Show less'
                                    : `Show all messages (${processedMessages.length - 3} more)`}
                            </Button>
                        </div>
                    )}

                    {/* --- REPLACED INPUT WITH TEXTAREA --- */}
                    {showSendMessage && (
                        <>
                            <div className='flex items-end gap-2'>
                                <textarea
                                    placeholder='Write a comment...'
                                    value={messageContent}
                                    onChange={(e) => {
                                        setMessageContent(e.target.value);
                                        adjustTextareaHeight(inputRef.current);
                                    }}
                                    ref={inputRef}
                                    rows={1}
                                    onKeyDown={(e) => {
                                        // Submit on Ctrl+Enter
                                        if (e.key === 'Enter' && e.ctrlKey) {
                                            e.preventDefault();
                                            handleSubmitMessage();
                                        }
                                        // Escape cancels reply
                                        else if (e.key === 'Escape') {
                                            setReplyTo(null);
                                        }
                                        // Enter just creates a new line (default behavior)
                                    }}
                                    // Tailwind classes for textarea styling
                                    className='flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                    style={{
                                        minHeight: '42px',
                                        height: '42px',
                                        overflow: 'hidden'
                                    }}
                                    disabled={!active}
                                />
                                <Button
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        if (messageContent.trim()) {
                                            handleSubmitMessage();
                                        }
                                    }}
                                    disabled={!messageContent.trim() || !active}
                                    className='w-10 h-10'
                                    shape='circle'
                                >
                                    ➤
                                </Button>
                            </div>
                            {/* --- END TEXTAREA REPLACEMENT --- */}

                            <p className='text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-4 text-right'>
                                Ctrl+Enter or ➤ to send
                            </p>
                        </>
                    )}

                    {showSendMessage && replyTo && (
                        <div className='flex flex-col pt-3 gap-2'>
                            {replyTo && (
                                <div className='flex flex-col bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg border-l-4 border-brand-600 dark:border-brand-300'>
                                    <div className='flex items-center justify-between mb-1'>
                                        <span className='text-xs font-semibold text-brand-600 dark:text-brand-300'>
                                            Replying to{' '}
                                            {getDisplayName(replyTo.author)}
                                        </span>
                                        <button
                                            className='text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 ml-2'
                                            onClick={() => setReplyTo(null)}
                                            title='Cancel reply (Esc)'
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <span className='text-xs text-zinc-600 dark:text-zinc-300 truncate'>
                                        {replyTo.content.slice(0, 100)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'>
                    <div className='bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl'>
                        <h3 className='text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100'>
                            Delete Comment
                        </h3>
                        <p className='text-sm text-gray-600 dark:text-gray-300 mb-6'>
                            Are you sure you want to delete this comment? This
                            action cannot be undone.
                        </p>
                        <div className='flex gap-3 justify-end'>
                            <Button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setMessageToDelete(null);
                                }}
                                variant='secondary'
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmDelete}
                                variant='danger'
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageList;
