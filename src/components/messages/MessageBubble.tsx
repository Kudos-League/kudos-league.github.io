import React from 'react';
import { MessageDTO } from '@/shared/api/types';
import TextWithLinks from '../common/TextWithLinks';
import UserCard from '../users/UserCard';
import { ArrowUturnLeftIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';

interface Props {
    message: MessageDTO;
    isOwn?: boolean;
    compact?: boolean;
    onReply?: (m: MessageDTO) => void;
    onDelete?: (m: MessageDTO) => void;
    canDelete?: boolean;
    replyTo?: MessageDTO | null;
    onEdit?: (m: MessageDTO) => void;
    canEdit?: boolean;
    isEditing?: boolean;
    editContent?: string;
    onEditChange?: (content: string) => void;
    onEditSave?: (messageId: number) => void;
    onEditCancel?: () => void;
    showSenderName?: boolean; // New prop for WhatsApp-style sender name display
}

// Helper to get display name (prioritize displayName, fallback to name or username)
const getDisplayName = (user: any) => {
    return user?.displayName || user?.name || user?.username || 'Unknown';
};

const parseDate = (date: string | Date | null | undefined): Date | null => {
    if (!date) return null;
    if (date instanceof Date) {
        return isNaN(date.getTime()) ? null : date;
    }
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
};

// Helper function to check if message was edited
// Uses a 5-second threshold to account for database timing differences
const isMessageEdited = (createdAt: string | Date | null | undefined, updatedAt: string | Date | null | undefined): boolean => {
    const created = parseDate(createdAt);
    const updated = parseDate(updatedAt);
    
    // If either date is invalid, assume not edited
    if (!created || !updated) return false;
    
    // Compare timestamps with 5-second threshold
    // This accounts for minor timing differences in database operations
    const diffInSeconds = Math.abs(updated.getTime() - created.getTime()) / 1000;
    return diffInSeconds > 5;
};


const MessageBubble: React.FC<Props> = ({
    message,
    isOwn = false,
    onReply,
    onDelete,
    canDelete = false,
    replyTo,
    onEdit,
    canEdit = false,
    isEditing = false,
    editContent = '',
    onEditChange,
    onEditSave,
    onEditCancel,
    showSenderName = false
}) => {
    return (
        <div
            id={`msg-${message.id}`}
            className={`group relative flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
        >
            <div className={`max-w-[85%] sm:max-w-md min-w-0 ${isOwn ? 'text-right' : 'text-left'}`}>
                {/* Show sender name for non-own messages (WhatsApp style) */}
                {!isOwn && showSenderName && (
                    <div className="text-xs font-semibold mb-1 ml-1 text-teal-600 dark:text-teal-400">
                        <UserCard
                            triggerVariant='name'
                            user={message.author}
                        />                    

                    </div>
                )}

                {/* Reply preview - WhatsApp style */}
                {replyTo && !isEditing && (
                    <div className={`mb-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>
                        <button
                            type='button'
                            onClick={() => {
                                const el = document.getElementById(`msg-${replyTo.id}`);
                                if (el) {
                                    el.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'center'
                                    });
                                    el.classList.add('ring-2', 'ring-teal-400');
                                    setTimeout(() => {
                                        el.classList.remove('ring-2', 'ring-teal-400');
                                    }, 1200);
                                }
                            }}
                            className={`block w-full text-left px-2 py-1.5 rounded-t-lg border-l-4 ${
                                isOwn
                                    ? 'bg-teal-700/40 border-teal-300'
                                    : 'bg-gray-100 dark:bg-zinc-600 border-teal-500'
                            }`}
                        >
                            <div className={`text-xs font-semibold mb-0.5 ${
                                isOwn 
                                    ? 'text-teal-200' 
                                    : 'text-teal-600 dark:text-teal-300'
                            }`}>
                                <UserCard
                                    triggerVariant='name'
                                    user={replyTo.author}
                                />
                            </div>
                            <div className={`text-xs line-clamp-2 ${
                                isOwn 
                                    ? 'text-teal-200' 
                                    : 'text-zinc-600 dark:text-zinc-300'
                            }`}>
                                {replyTo.content}
                            </div>
                        </button>
                    </div>
                )}

                <div
                    className={`relative px-4 py-3 ${
                        replyTo && !isEditing ? 'rounded-b-xl' : 'rounded-xl'
                    } ${
                        isOwn ? 'rounded-br-none' : 'rounded-bl-none'
                    } text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere shadow-sm transition-colors transform-gpu ${
                        isOwn
                            ? 'bg-teal-600 dark:bg-teal-500 text-white'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-600'
                    }`}
                >
                    {isEditing ? (
                        // Edit mode
                        <div className='space-y-2'>
                            <textarea
                                value={editContent}
                                onChange={(e) => onEditChange?.(e.target.value)}
                                className='w-full max-w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 text-zinc-900 bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-white'
                                rows={3}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                        e.preventDefault();
                                        onEditSave?.(message.id);
                                    }
                                    else if (e.key === 'Escape') {
                                        e.preventDefault();
                                        onEditCancel?.();
                                    }
                                }}
                            />
                            <div className='flex gap-2'>
                                <Button
                                    onClick={() => onEditSave?.(message.id)}
                                    disabled={!editContent.trim()}
                                    className='text-xs px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded'
                                >
                                    Save
                                </Button>
                                <Button
                                    onClick={onEditCancel}
                                    variant='secondary'
                                    className='text-xs px-3 py-1'
                                >
                                    Cancel
                                </Button>
                            </div>
                            <p className='text-xs text-zinc-500 dark:text-zinc-400'>
                                Press Ctrl+Enter to save, Esc to cancel
                            </p>
                        </div>
                    ) : (
                        // View mode
                        <>
                            {message.deletedAt ? (
                                <div className='text-white dark:text-zinc-300 italic opacity-90'>
                                    [deleted message]
                                </div>
                            ) : (
                                isMessageEdited(message.createdAt, message.updatedAt) ? (
                                    <>
                                        <TextWithLinks className='italic opacity-90'>
                                            {`[edited] `} 
                                        </TextWithLinks>
                                        <TextWithLinks>{message.content}</TextWithLinks>
                                    </>
                                ) : (
                                    <TextWithLinks>{message.content}</TextWithLinks>
                                )
                            )}

                            {/* Action buttons - only show when not editing */}
                            <div
                                className={`absolute z-50 bottom-1 ${
                                    isOwn ? 'left-1' : 'right-1'
                                } opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-zinc-800 rounded px-1.5 py-1 shadow-lg border border-zinc-300 dark:border-zinc-600`}
                            >
                                <button
                                    type='button'
                                    title={message.deletedAt ? 'Message deleted' : 'Reply'}
                                    onClick={() => onReply?.(message)}
                                    disabled={Boolean(message.deletedAt)}
                                    className={`p-1 rounded ${message.deletedAt ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                >
                                    <ArrowUturnLeftIcon className={`w-4 h-4 ${message.deletedAt ? 'text-zinc-400 dark:text-teal-200' : 'text-zinc-700 dark:text-zinc-200'}`} />
                                </button>
                                {canEdit && (
                                    <button
                                        type='button'
                                        title={message.deletedAt ? 'Message deleted' : 'Edit'}
                                        onClick={() => onEdit?.(message)}
                                        disabled={Boolean(message.deletedAt)}
                                        className={`p-1 rounded ${message.deletedAt ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                    >
                                        <PencilIcon className={`w-4 h-4 ${message.deletedAt ? 'text-zinc-400 dark:text-teal-200' : 'text-zinc-700 dark:text-zinc-200'}`} />
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        type='button'
                                        title={message.deletedAt ? 'Message deleted' : 'Delete'}
                                        onClick={() => onDelete?.(message)}
                                        disabled={Boolean(message.deletedAt)}
                                        className={`p-1 rounded ${message.deletedAt ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                    >
                                        <TrashIcon className={`w-4 h-4 ${message.deletedAt ? 'text-zinc-400 dark:text-teal-200' : 'text-zinc-700 dark:text-zinc-200'}`} />
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
