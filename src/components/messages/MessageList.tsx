import React, { useState, useMemo, useRef } from 'react';
import {
    CreateMessageDTO,
    MessageDTO,
    UpdateMessageDTO
} from '@/shared/api/types';
import {
    sendMessage,
    updateMessage,
    deleteMessage
} from '@/shared/api/actions';
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
    showSendMessage?: boolean;
    allowEdit?: boolean;
    allowDelete?: boolean;
}

const MessageList: React.FC<Props> = ({
    messages,
    title,
    callback,
    onMessageUpdate,
    onMessageDelete,
    postID,
    showSendMessage,
    allowEdit = false,
    allowDelete = false
}) => {
    const { user } = useAuth();
    const token = useAppSelector((state) => state.auth.token);
    const [showAllMessages, setShowAllMessages] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<number | null>(
        null
    );
    const [editContent, setEditContent] = useState('');
    const [replyTo, setReplyTo] = useState<MessageDTO | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
            postID,
            ...(replyTo?.id ? { replyToMessageID: replyTo.id } : {})
        };

        try {
            const response = await sendMessage(newMessage, token);
            // Ensure author info is present locally to avoid "Anonymous" until refresh
            const enriched: MessageDTO = {
                ...response,
                author: response.author || user || undefined,
                authorID:
                    response.authorID ?? user.id ?? response.author?.id
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

        // Find the original message to preserve author data
        const originalMessage = processedMessages.find(
            (msg) => msg.id === messageId
        );
        if (!originalMessage) return;

        try {
            const response = await updateMessage(
                messageId,
                { content: editContent },
                token
            );

            // Merge the response with original author data to ensure we don't lose it
            const updatedMessage: MessageDTO = {
                ...response,
                author: response.author || originalMessage.author // Preserve original author if not in response
            };

            // Use specific callback for updates, fallback to general callback
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

        // Simple confirmation
        if (!window.confirm('Are you sure you want to delete this message?')) {
            return;
        }

        try {
            await deleteMessage(messageId, token);

            // Use specific callback for deletions, fallback to general callback
            if (onMessageDelete) {
                onMessageDelete(messageId);
            }
            else {
                // For general callback, just trigger a refresh without passing the deleted message
                callback?.({ type: 'delete', messageId });
            }
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

    // Enhanced Message Component with edit/delete functionality
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
                    <span className='font-semibold text-zinc-900 dark:text-zinc-100'>
                        <UserCard user={msg.author} />
                    </span>

                    {/* Action buttons */}
                    <div className='flex gap-1'>
                        {/* Reply */}
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

                {/* Reply preview */}
                {msg.replyToMessageID && (
                    <div className='mb-2'>
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
                                        el.classList.add('ring-2', 'ring-teal-400');
                                        setTimeout(() => {
                                            el.classList.remove(
                                                'ring-2',
                                                'ring-teal-400'
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
                            className='inline-flex items-center gap-2 max-w-full text-xs pl-2 pr-2 py-1 border-l-2 border-zinc-400/60 bg-zinc-100/80 dark:bg-zinc-800/60 rounded text-zinc-700 dark:text-zinc-200'
                            title={`${byId.get(msg.replyToMessageID)?.author?.username ?? 'Unknown'}: ${byId.get(msg.replyToMessageID)?.content ?? ''}`}
                        >
                            <span className='font-semibold inline-flex items-center gap-1 shrink-0'>
                                <UserCard
                                    triggerVariant='name'
                                    user={byId.get(msg.replyToMessageID)?.author}
                                />
                            </span>
                            <span className='opacity-90 truncate'>
                                {byId.get(msg.replyToMessageID)?.content ?? 'Original message'}
                            </span>
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

    return (
        <div>
            {title && (
                <div className='mb-3'>
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
                <div className='flex flex-col border-t pt-3 gap-2'>
                    {replyTo && (
                        <div className='flex items-center justify-between text-xs text-zinc-600 bg-zinc-100 px-2 py-1 rounded'>
                            <span className='truncate'>
                                Replying to: {replyTo.content.slice(0, 80)}
                            </span>
                            <button
                                className='text-blue-600 hover:underline ml-2 shrink-0'
                                onClick={() => setReplyTo(null)}
                                title='Cancel reply (Esc)'
                            >
                                Cancel
                            </button>
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
