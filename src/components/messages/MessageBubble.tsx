import React, { useState, useRef } from 'react';
import { MessageDTO } from '@/shared/api/types';
import TextWithLinks from '../common/TextWithLinks';
import UserCard from '../users/UserCard';
import {
    ArrowUturnLeftIcon,
    TrashIcon,
    PencilIcon,
    XMarkIcon,
    ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
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
    showSenderName?: boolean;
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
const isMessageEdited = (
    createdAt: string | Date | null | undefined,
    updatedAt: string | Date | null | undefined
): boolean => {
    const created = parseDate(createdAt);
    const updated = parseDate(updatedAt);

    // If either date is invalid, assume not edited
    if (!created || !updated) return false;

    // Compare timestamps with 5-second threshold
    // This accounts for minor timing differences in database operations
    const diffInSeconds =
        Math.abs(updated.getTime() - created.getTime()) / 1000;
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
    const [showActions, setShowActions] = useState(false);
    const [copied, setCopied] = useState(false);
    const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartPos = useRef<{ x: number; y: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close actions when clicking outside
    React.useEffect(() => {
        if (!showActions) return;

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setShowActions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showActions]);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isEditing) return;

        const touch = e.touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };

        touchTimerRef.current = setTimeout(() => {
            setShowActions(true);
            // Haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }, 500); // 500ms hold to show actions
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartPos.current) return;

        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

        // Cancel if user moves finger more than 10px
        if (deltaX > 10 || deltaY > 10) {
            if (touchTimerRef.current) {
                clearTimeout(touchTimerRef.current);
                touchTimerRef.current = null;
            }
            touchStartPos.current = null;
        }
    };

    const handleTouchEnd = () => {
        if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current);
            touchTimerRef.current = null;
        }
        touchStartPos.current = null;
    };

    const handleActionClick = (
        e: React.MouseEvent | React.TouchEvent,
        action: () => void
    ) => {
        e.stopPropagation();
        action();
        setShowActions(false);
    };

    const handleCopy = () => {
        if (message.content) {
            navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    return (
        <div
            ref={containerRef}
            id={`msg-${message.id}`}
            className={`group flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-2 items-end`}
        >
            <div
                className={`relative max-w-[85%] sm:max-w-md min-w-0 ${isOwn ? 'text-right' : 'text-left'}`}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Cancel button when editing */}
                {isOwn && isEditing && (
                    <div className='absolute -left-14 bottom-0 opacity-100 transition-opacity flex gap-1 bg-amber-50/95 dark:bg-amber-900/30 rounded px-1.5 py-1 shadow-lg border border-amber-400 dark:border-amber-500 z-10 backdrop-blur-sm'>
                        <button
                            type='button'
                            title='Cancel edit (Esc)'
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditCancel?.();
                            }}
                            className='p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/30'
                        >
                            <XMarkIcon className='w-4 h-4 text-amber-600 dark:text-amber-400' />
                        </button>
                    </div>
                )}

                {/* Action buttons - positioned absolutely at bottom for own messages */}
                {isOwn && !isEditing && (
                    <div
                        className={`absolute -left-14 bottom-0 ${showActions ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'} transition-opacity flex gap-1 bg-white/95 dark:bg-zinc-800/95 rounded px-1.5 py-1 shadow-lg border border-zinc-300 dark:border-zinc-600 z-10 backdrop-blur-sm`}
                    >
                        <button
                            type='button'
                            title={
                                message.deletedAt ? 'Message deleted' : 'Reply'
                            }
                            onClick={(e) =>
                                handleActionClick(e, () => onReply?.(message))
                            }
                            disabled={Boolean(message.deletedAt)}
                            className={`p-1 rounded ${message.deletedAt ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                        >
                            <ArrowUturnLeftIcon
                                className={`w-4 h-4 ${message.deletedAt ? 'text-zinc-400 dark:text-brand-200' : 'text-zinc-700 dark:text-zinc-200'}`}
                            />
                        </button>
                        {canEdit && (
                            <button
                                type='button'
                                title={
                                    message.deletedAt
                                        ? 'Message deleted'
                                        : 'Edit'
                                }
                                onClick={(e) =>
                                    handleActionClick(e, () =>
                                        onEdit?.(message)
                                    )
                                }
                                disabled={Boolean(message.deletedAt)}
                                className={`p-1 rounded ${message.deletedAt ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                            >
                                <PencilIcon
                                    className={`w-4 h-4 ${message.deletedAt ? 'text-zinc-400 dark:text-brand-200' : 'text-zinc-700 dark:text-zinc-200'}`}
                                />
                            </button>
                        )}
                        {!message.deletedAt && (
                            <button
                                type='button'
                                title={copied ? 'Copied!' : 'Copy'}
                                onClick={(e) =>
                                    handleActionClick(e, handleCopy)
                                }
                                className='p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            >
                                <ClipboardDocumentIcon
                                    className={`w-4 h-4 ${copied ? 'text-green-500' : 'text-zinc-700 dark:text-zinc-200'}`}
                                />
                            </button>
                        )}
                        {canDelete && (
                            <button
                                type='button'
                                title={
                                    message.deletedAt ? 'Message deleted' : 'Delete'
                                }
                                onClick={(e) =>
                                    handleActionClick(e, () => onDelete?.(message))
                                }
                                disabled={Boolean(message.deletedAt)}
                                className={`p-1 rounded ${message.deletedAt ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                            >
                                <TrashIcon
                                    className={`w-4 h-4 ${message.deletedAt ? 'text-zinc-400 dark:text-brand-200' : 'text-zinc-700 dark:text-zinc-200'}`}
                                />
                            </button>
                        )}
                    </div>
                )}
                {/* Show sender name for non-own messages (WhatsApp style) */}
                {!isOwn && showSenderName && (
                    <div className='text-xs font-semibold mb-1 ml-1 text-brand-600 dark:text-brand-300'>
                        <UserCard triggerVariant='name' user={message.author} />
                    </div>
                )}

                {/* Reply preview - WhatsApp style */}
                {replyTo && !isEditing && (
                    <div className={`mb-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>
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
                                }
                            }}
                            className={`block w-full text-left px-2 py-1.5 rounded-t-lg border-l-4 ${
                                isOwn
                                    ? 'bg-brand-700/40 border-brand-300'
                                    : 'bg-gray-100 dark:bg-zinc-600 border-brand-600'
                            }`}
                        >
                            <div
                                className={`text-xs font-semibold mb-0.5 ${
                                    isOwn
                                        ? 'text-white/90'
                                        : 'text-zinc-900 dark:text-zinc-100'
                                }`}
                            >
                                <UserCard
                                    triggerVariant='name'
                                    user={replyTo.author}
                                />
                            </div>
                            <div
                                className={`text-xs line-clamp-2 ${
                                    isOwn
                                        ? 'text-white/80'
                                        : 'text-zinc-600 dark:text-zinc-300'
                                }`}
                            >
                                {replyTo.content}
                            </div>
                        </button>
                    </div>
                )}

                <div
                    className={`relative px-4 py-3 select-none ${
                        replyTo && !isEditing ? 'rounded-b-xl' : 'rounded-xl'
                    } ${
                        isOwn ? 'rounded-br-none' : 'rounded-bl-none'
                    } text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere shadow-sm transition-colors transform-gpu ${
                        isOwn
                            ? 'bg-brand-600 dark:bg-brand-400 text-white'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-600'
                    } ${
                        isEditing
                            ? 'ring-2 ring-amber-400 dark:ring-amber-500'
                            : ''
                    }`}
                >
                    {message.deletedAt ? (
                        <div className='text-white dark:text-zinc-300 italic opacity-90'>
                            [deleted message]
                        </div>
                    ) : (
                        <>
                            {isEditing && (
                                <div className='text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1'>
                                    Editing this message...
                                </div>
                            )}
                            {isMessageEdited(
                                message.createdAt,
                                message.updatedAt
                            ) ? (
                                    <>
                                        <TextWithLinks className='italic opacity-90'
                                            linkClassName={isOwn ? 'text-blue-200 hover:text-blue-100 underline' : 'text-sky-500 hover:text-sky-400 underline dark:text-sky-400 dark:hover:text-sky-300'}>
                                            {`[edited] `}
                                        </TextWithLinks>
                                        <TextWithLinks
                                            linkClassName={isOwn ? 'text-blue-200 hover:text-blue-100 underline' : 'text-sky-500 hover:text-sky-400 underline dark:text-sky-400 dark:hover:text-sky-300'}>
                                            {message.content}
                                        </TextWithLinks>
                                    </>
                                ) : (
                                    <TextWithLinks
                                        linkClassName={isOwn ? 'text-blue-200 hover:text-blue-100 underline' : 'text-sky-500 hover:text-sky-400 underline dark:text-sky-400 dark:hover:text-sky-300'}>
                                        {message.content}
                                    </TextWithLinks>
                                )}
                        </>
                    )}
                </div>

                {/* Action buttons - positioned absolutely at bottom for other users' messages */}
                {!isOwn && !isEditing && (
                    <div
                        className={`absolute -right-8 bottom-0 ${showActions ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'} transition-opacity flex gap-1 bg-white/95 dark:bg-zinc-800/95 rounded px-1.5 py-1 shadow-lg border border-zinc-300 dark:border-zinc-600 z-10 backdrop-blur-sm`}
                    >
                        <button
                            type='button'
                            title={
                                message.deletedAt ? 'Message deleted' : 'Reply'
                            }
                            onClick={(e) =>
                                handleActionClick(e, () => onReply?.(message))
                            }
                            disabled={Boolean(message.deletedAt)}
                            className={`p-1 rounded ${message.deletedAt ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                        >
                            <ArrowUturnLeftIcon
                                className={`w-4 h-4 ${message.deletedAt ? 'text-zinc-400 dark:text-brand-200' : 'text-zinc-700 dark:text-zinc-200'}`}
                            />
                        </button>
                        {canEdit && (
                            <button
                                type='button'
                                title={
                                    message.deletedAt
                                        ? 'Message deleted'
                                        : 'Edit'
                                }
                                onClick={(e) =>
                                    handleActionClick(e, () =>
                                        onEdit?.(message)
                                    )
                                }
                                disabled={Boolean(message.deletedAt)}
                                className={`p-1 rounded ${message.deletedAt ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                            >
                                <PencilIcon
                                    className={`w-4 h-4 ${message.deletedAt ? 'text-zinc-400 dark:text-brand-200' : 'text-zinc-700 dark:text-zinc-200'}`}
                                />
                            </button>
                        )}
                        {!message.deletedAt && (
                            <button
                                type='button'
                                title={copied ? 'Copied!' : 'Copy'}
                                onClick={(e) =>
                                    handleActionClick(e, handleCopy)
                                }
                                className='p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            >
                                <ClipboardDocumentIcon
                                    className={`w-4 h-4 ${copied ? 'text-green-500' : 'text-zinc-700 dark:text-zinc-200'}`}
                                />
                            </button>
                        )}
                        {canDelete && (
                            <button
                                type='button'
                                title={
                                    message.deletedAt
                                        ? 'Message deleted'
                                        : 'Delete'
                                }
                                onClick={(e) =>
                                    handleActionClick(e, () =>
                                        onDelete?.(message)
                                    )
                                }
                                disabled={Boolean(message.deletedAt)}
                                className={`p-1 rounded ${message.deletedAt ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                            >
                                <TrashIcon
                                    className={`w-4 h-4 ${message.deletedAt ? 'text-zinc-400 dark:text-brand-200' : 'text-zinc-700 dark:text-zinc-200'}`}
                                />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;
