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
}

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
    onEditCancel
}) => {
    return (
        <div
            id={`msg-${message.id}`}
            className={`group relative flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 overflow-hidden`}
        >
            <div className={`max-w-md ${isOwn ? 'text-right' : 'text-left'}`}>
                {replyTo && (
                    <div
                        className={`${isOwn ? 'text-right' : 'text-left'} mb-1`}
                    >
                        <button
                            type='button'
                            onClick={() => {
                                const el = document.getElementById(
                                    `msg-${replyTo.id}`
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
                                }
                            }}
                            className={`inline-flex items-center gap-1 max-w-full ${
                                isOwn
                                    ? 'text-zinc-600 dark:text-zinc-300'
                                    : 'text-zinc-700 dark:text-zinc-200'
                            } text-xs pl-2 pr-2 py-1 border-l-2 ${
                                isOwn
                                    ? 'border-teal-300/70'
                                    : 'border-zinc-400/60'
                            } bg-zinc-100/80 dark:bg-zinc-800/60 rounded`}
                            title={`${replyTo.author?.username ?? 'Unknown'}: ${replyTo.content}`}
                        >
                            <span className='font-semibold inline-flex items-center gap-1 shrink-0'>
                                <UserCard
                                    triggerVariant='name'
                                    user={replyTo.author}
                                />
                            </span>
                            <span className='opacity-90 truncate'>
                                {replyTo.content}
                            </span>
                        </button>
                    </div>
                )}

                <div
                    className={`relative px-4 py-3 rounded-xl text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere shadow-sm transition-colors transform-gpu ${
                        isOwn
                            ? 'bg-teal-600 dark:bg-teal-500 text-white rounded-br-none'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-bl-none border border-zinc-300 dark:border-zinc-600'
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
                                <div className='text-zinc-300 dark:text-zinc-300 italic opacity-90'>
                                    [deleted message]
                                </div>
                            ) : (
                                message.updatedAt != message.createdAt ? (
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
                                className={`absolute z-10 -top-3 ${
                                    isOwn ? 'left-2' : 'right-2'
                                } opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 dark:bg-zinc-800/80 rounded px-1 py-0.5 shadow`}
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
