import React from 'react';
import { MessageDTO } from '@/shared/api/types';
import TextWithLinks from '../common/TextWithLinks';
import UserCard from '../users/UserCard';
import { ArrowUturnLeftIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Props {
    message: MessageDTO;
    isOwn?: boolean;
    compact?: boolean;
    onReply?: (m: MessageDTO) => void;
    onDelete?: (m: MessageDTO) => void;
    canDelete?: boolean;
    replyTo?: MessageDTO | null;
}

const MessageBubble: React.FC<Props> = ({
    message,
    isOwn = false,
    onReply,
    onDelete,
    canDelete = false,
    replyTo
}) => {
    return (
        <div
            id={`msg-${message.id}`}
            className={`group relative flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}
        >
            <div className={`max-w-md ${isOwn ? 'text-right' : 'text-left'}`}>
                {replyTo && (
                    <div className={`${isOwn ? 'text-right' : 'text-left'} mb-1`}>
                        <button
                            type='button'
                            onClick={() => {
                                const el = document.getElementById(`msg-${replyTo.id}`);
                                if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    el.classList.add('ring-2', 'ring-teal-400');
                                    setTimeout(() => {
                                        el.classList.remove('ring-2', 'ring-teal-400');
                                    }, 1200);
                                }
                            }}
                            className={`inline-flex items-center gap-1 max-w-full ${
                                isOwn
                                    ? 'text-zinc-600 dark:text-zinc-300'
                                    : 'text-zinc-700 dark:text-zinc-200'
                            } text-xs pl-2 pr-2 py-1 border-l-2 ${
                                isOwn ? 'border-teal-300/70' : 'border-zinc-400/60'
                            } bg-zinc-100/80 dark:bg-zinc-800/60 rounded`}
                            title={`${replyTo.author?.username ?? 'Unknown'}: ${replyTo.content}`}
                        >
                            <span className='font-semibold inline-flex items-center gap-1 shrink-0'>
                                <UserCard triggerVariant='name' user={replyTo.author} />
                            </span>
                            <span className='opacity-90 truncate'>
                                {replyTo.content}
                            </span>
                        </button>
                    </div>
                )}

                <div
                    className={`relative px-4 py-3 rounded-xl text-sm whitespace-pre-wrap break-words shadow-sm transition-colors transform-gpu ${
                        isOwn
                            ? 'bg-teal-600 dark:bg-teal-500 text-white rounded-br-none'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-bl-none border border-zinc-300 dark:border-zinc-600'
                    }`}
                >
                    <TextWithLinks>{message.content}</TextWithLinks>

                    <div
                        className={`absolute z-10 -top-3 ${
                            isOwn ? 'left-2' : 'right-2'
                        } opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 dark:bg-zinc-800/80 rounded px-1 py-0.5 shadow`}
                    >
                        <button
                            type='button'
                            title='Reply'
                            onClick={() => onReply?.(message)}
                            className='p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        >
                            <ArrowUturnLeftIcon className='w-4 h-4 text-zinc-700 dark:text-zinc-200' />
                        </button>
                        {canDelete && (
                            <button
                                type='button'
                                title='Delete'
                                onClick={() => onDelete?.(message)}
                                className='p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            >
                                <TrashIcon className='w-4 h-4 text-zinc-700 dark:text-zinc-200' />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
