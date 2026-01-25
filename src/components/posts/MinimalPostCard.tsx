import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import { PostDTO } from '@/shared/api/types';
import { getEndpointUrl } from '@/shared/api/config';
import { timeAgoLabel } from '@/shared/timeAgoLabel';

interface MinimalPostCardProps {
    post: PostDTO;
    onExpandHandshakes?: () => void;
    isExpanded?: boolean;
    hasHandshakes?: boolean;
}

export default function MinimalPostCard({
    post,
    onExpandHandshakes,
    isExpanded,
    hasHandshakes
}: MinimalPostCardProps) {
    const navigate = useNavigate();
    const thumbnail = post.images?.[0]
        ? getEndpointUrl() + post.images[0]
        : null;

    const handshakeCount = post.handshakes?.filter(
        (h) => h.status !== 'cancelled'
    ).length;

    return (
        <div className='flex items-stretch bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded hover:border-gray-400 dark:hover:border-gray-500 transition-colors'>
            {/* Thumbnail */}
            <div
                className='w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden cursor-pointer'
                onClick={() => navigate(`/post/${post.id}`)}
            >
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={post.title}
                        className='w-full h-full object-cover'
                    />
                ) : (
                    <span className='text-gray-400 dark:text-gray-500 text-xs text-center px-1'>
                        No img
                    </span>
                )}
            </div>

            {/* Content */}
            <div className='flex-1 min-w-0 px-2 py-1.5 flex flex-col justify-center'>
                <div
                    className='font-medium text-sm text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:underline'
                    onClick={() => navigate(`/post/${post.id}`)}
                >
                    {post.title}
                </div>
                <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                    <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            post.type === 'gift'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        }`}
                    >
                        {post.type?.toUpperCase()}
                    </span>
                    <span>by</span>
                    <span className='font-medium text-gray-700 dark:text-gray-300 hover:underline cursor-pointer'>
                        {post.sender?.displayName || post.sender?.username}
                    </span>
                    <span className='text-gray-400'>•</span>
                    <span>{timeAgoLabel(post.createdAt as any)}</span>
                </div>
                <div className='text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate'>
                    {post.body?.slice(0, 80)}
                    {(post.body?.length ?? 0) > 80 ? '...' : ''}
                </div>
            </div>

            {/* Handshakes expand button */}
            {hasHandshakes && handshakeCount && handshakeCount > 0 ? (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onExpandHandshakes?.();
                    }}
                    className='flex items-center gap-1 px-3 bg-gray-50 dark:bg-slate-900 border-l border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors'
                    title='Show handshakes'
                >
                    <span className='text-xs font-medium'>{handshakeCount}</span>
                    {isExpanded ? (
                        <ChevronDownIcon className='w-4 h-4' />
                    ) : (
                        <ChevronRightIcon className='w-4 h-4' />
                    )}
                </button>
            ) : null}
        </div>
    );
}
