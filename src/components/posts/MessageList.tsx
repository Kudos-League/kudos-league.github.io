import React, { useState, useMemo, useRef } from 'react';
import { CreateMessageDTO, MessageDTO } from '@/shared/api/types';
import { useSendMessage, useUpdateMessage, useDeleteMessage } from '@/shared/api/mutations/messages';
import { useAuth } from '@/contexts/useAuth';
import { useAppSelector } from 'redux_store/hooks';
import Button from '../common/Button';
import UserCard from '../users/UserCard';
import TextWithLinks from '../common/TextWithLinks';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

interface Props {
    messages: MessageDTO[];
    title?: string;
    callback?: (data: any) => void;
    onMessageUpdate?: (updatedMessage: MessageDTO) => void;
    onMessageDelete?: (deletedMessageId: number) => void;
    postID?: number;
    eventID?: number;
    showSendMessage?: boolean;
    allowEdit?: boolean;
    allowDelete?: boolean;
}

// Helper to get display name (prioritize displayName, fallback to name or username)
const getDisplayName = (user: any) => {
    return user?.displayName || user?.name || user?.username || 'Unknown';
};

const MessageList: React.FC<Props> = ({
    messages,
    title,
    callback,
    onMessageUpdate,
    onMessageDelete,
    postID,
    eventID,
    showSendMessage,
    allowEdit = false,
    allowDelete = false
}) => {
    const { user } = useAuth();
    const token = useAppSelector((state) => state.auth.token);
    const sendMessageMutation = useSendMessage((postID ?? eventID) as number | undefined);
    const updateMessageMutation = useUpdateMessage();
    const deleteMessageMutation = useDeleteMessage();
    const [showAllMessages, setShowAllMessages] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [replyTo, setReplyTo] = useState<MessageDTO | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const processedMessages = useMemo(() => {
        if (!messages || messages.length === 0) return [];

        const timestampOf = (value: MessageDTO['createdAt']) => {
            if (!value) return null;
            const date = value instanceof Date ? value : new Date(value);
            const time = date.getTime();
            return Number.isNaN(time) ? null : time;
        };

        return [...messages].sort((a, b) => {
            const aTime = timestampOf(a.createdAt);
            const bTime = timestampOf(b.createdAt);

            if (aTime !== null && bTime !== null && aTime !== bTime) {
                return bTime - aTime;
            }

            if (aTime !== null && bTime === null) return -1;
            if (aTime === null && bTime !== null) return 1;

            return b.id - a.id;
        });
    }, [messages]);

    const handleSubmitMessage = async () => {
        if (!messageContent.trim() || !user || !token || (!postID && !eventID)) return;

        const newMessage: CreateMessageDTO = {
            content: messageContent,
            authorID: user.id,
            ...(postID ? { postID } : {}),
            ...(eventID ? { eventID } : {}),
            ...(replyTo?.id ? { replyToMessageID: replyTo.id } : {})
        };

        try {
            const response = await sendMessageMutation.mutateAsync(newMessage as any);
            const enriched: MessageDTO = {
                ...response,
                author: response.author || user || undefined,
                authorID: response.authorID ?? user.id ?? response.author?.id
            } as MessageDTO;
            callback?.(enriched);
            setMessageContent('');
            setReplyTo(null);
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

        const originalMessage = processedMessages.find((msg) => msg.id === messageId);
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

    const handleDelete = async (messageId: number) => {
        if (!token) return;

        if (!window.confirm('Are you sure you want to delete this message?')) {
            return;
        }

        try {
            await deleteMessageMutation.mutateAsync(messageId);

            const original = processedMessages.find((m) => m.id === messageId);
            if (!original) {
                onMessageDelete?.(messageId);
                callback?.({ type: 'delete', messageId });
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

            onMessageDelete?.(messageId);
        }
        catch (err) {
            console.error('Failed to delete message:', err);
            alert('Failed to delete message. Please try again.');
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

    const renderMessage = (msg: MessageDTO) => {
        const isEditing = editingMessageId === msg.id;
        const showEditButton = canEditMessage(msg);
        const showDeleteButton = canDeleteMessage(msg);

        return (
            <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className='border-b border-zinc-200 dark:border-zinc-700 py-3 last:border-b-0'
            >
                <div className='mb-2 flex justify-between items-start'>
                    <div>
                        <span className='text-xs font-semibold text-teal-600 dark:text-teal-400 block mb-1'>
                            <UserCard
                                triggerVariant='name'
                                user={replyTo.author}
                            />
                        </span>
                        <span className='font-semibold text-zinc-900 dark:text-zinc-100'>
                            <UserCard user={msg.author} />
                        </span>
                    </div>

                    {/* Action buttons */}
                    <div className='flex gap-1'>
                        {!isEditing && (
                            <button
                                type='button'
                                title='Reply'
                                onClick={() => {
                                    setReplyTo(msg);
                                    setTimeout(() => inputRef.current?.focus(), 0);
                                }}
                                className='p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            >
                                <ArrowUturnLeftIcon className='w-4 h-4 text-zinc-700 dark:text-zinc-200' />
                            </button>
                        )}
                        {(showEditButton || showDeleteButton) && !isEditing && (
                            <>
                                {showEditButton && (
                                    <Button
                                        onClick={() => handleEditStart(msg)}
                                        className='text-xs'
                                    >
                                        Edit
                                    </Button>
                                )}
                                {showDeleteButton && (
                                    <Button
                                        onClick={() => handleDelete(msg.id)}
                                        variant='danger'
                                        className='text-xs'
                                    >
                                        Delete
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Reply preview - WhatsApp style */}
                {msg.replyToMessageID && (
                    <div className='mb-2 ml-1'>
                        <button
                            type='button'
                            onClick={() => {
                                const tryScroll = () => {
                                    const el = document.getElementById(`msg-${msg.replyToMessageID}`);
                                    if (el) {
                                        el.scrollIntoView({
                                            behavior: 'smooth',
                                            block: 'center'
                                        });
                                        el.classList.add('ring-2', 'ring-teal-400');
                                        setTimeout(() => {
                                            el.classList.remove('ring-2', 'ring-teal-400');
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
                            className='block w-full text-left px-2 py-1.5 rounded-lg border-l-4 border-teal-500 bg-gray-100 dark:bg-zinc-700'
                        >
                            <div className='text-xs font-semibold mb-0.5 text-teal-600 dark:text-teal-400'>
                                <UserCard
                                    triggerVariant='name'
                                    user={replyTo.author}
                                />
                            </div>
                            <div className='text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2'>
                                {byId.get(msg.replyToMessageID)?.content ?? 'Original message'}
                            </div>
                        </button>
                    </div>
                )}

                {/* Message content or edit form */}
                {isEditing ? (
                    <div className='space-y-2'>
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className='w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500'
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
                    <TextWithLinks className='text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap'>
                        {msg.content}
                    </TextWithLinks>
                )}
            </div>
        );
    };

    const displayedMessages = showAllMessages
        ? processedMessages
        : processedMessages.slice(0, 3);
    const hasMoreMessages = processedMessages.length > 3;

    console.log({ processedMessages, displayedMessages, showAllMessages });

    return (
        <div>
            {title && (
                <div className='mb-3'>
                    <h2 className='text-lg font-bold'>{title}</h2>
                </div>
            )}

            <div className='max-h-72 mb-3'>
                {processedMessages.length === 0 && (
                    <p className='text-red-500 text-sm mb-2'>No comments yet</p>
                )}

                {displayedMessages.map(renderMessage)}
            </div>

            {showSendMessage && (
                <div className='flex flex-col border-t pt-3 gap-2'>
                    {replyTo && (
                        <div className='flex flex-col bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg border-l-4 border-teal-500'>
                            <div className='flex items-center justify-between mb-1'>
                                <span className='text-xs font-semibold text-teal-600 dark:text-teal-400'>
                                    Replying to {getDisplayName(replyTo.author)}
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
                    <div className='flex items-center gap-2'>
                        <input
                            type='text'
                            placeholder='Type a message...'
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            ref={inputRef}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSubmitMessage();
                                }
                                else if (e.key === 'Escape') {
                                    setReplyTo(null);
                                }
                            }}
                            className='flex-1 px-3 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                        <Button
                            onClick={handleSubmitMessage}
                            disabled={!messageContent.trim()}
                            className='w-10 h-10'
                            shape='circle'
                        >
                            ➤
                        </Button>
                    </div>
                </div>
            )}

            {hasMoreMessages && !showAllMessages && (
                <div className='flex justify-between items-center mt-3'>
                    <Button
                        onClick={() => setShowAllMessages(true)}
                        variant='secondary'
                    >
                        Show more messages ({processedMessages.length - 3} more)
                    </Button>

                    <span className='text-xs text-gray-500'>
                        {processedMessages.length} message
                        {processedMessages.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {showAllMessages && hasMoreMessages && (
                <Button
                    onClick={() => setShowAllMessages(false)}
                    variant='secondary'
                >
                    Show less
                </Button>
            )}
        </div>
    );
};

export default MessageList;
