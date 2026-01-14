import React, { useState, useEffect } from 'react';
import { useSearchPostsQuery } from '@/shared/api/queries/posts';
import { useSearchUsersQuery } from '@/shared/api/queries/users';
import type { PostDTO, UserDTO } from '@/shared/api/types';

type SelectedItem = {
    type: 'post' | 'user';
    id: number;
    data: PostDTO | UserDTO;
};

export default function SearchDebugSection() {
    const [postQuery, setPostQuery] = useState('');
    const [userQuery, setUserQuery] = useState('');
    const [debouncedPostQuery, setDebouncedPostQuery] = useState('');
    const [debouncedUserQuery, setDebouncedUserQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

    // Debounce post search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedPostQuery(postQuery), 300);
        return () => clearTimeout(timer);
    }, [postQuery]);

    // Debounce user search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedUserQuery(userQuery), 300);
        return () => clearTimeout(timer);
    }, [userQuery]);

    const { data: postResults = [] } = useSearchPostsQuery(debouncedPostQuery);
    const { data: userResults = [] } = useSearchUsersQuery(debouncedUserQuery);

    const handleSelectPost = (post: PostDTO) => {
        setSelectedItem({
            type: 'post',
            id: post.id,
            data: post
        });
    };

    const handleSelectUser = (user: UserDTO) => {
        setSelectedItem({
            type: 'user',
            id: user.id,
            data: user
        });
    };

    const isPost = selectedItem?.type === 'post';
    const isUser = selectedItem?.type === 'user';

    return (
        <div className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Post Search */}
                <div className='space-y-3'>
                    <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        Search Posts
                    </label>
                    <input
                        type='text'
                        value={postQuery}
                        onChange={(e) => setPostQuery(e.target.value)}
                        placeholder='Search posts (min 2 chars)...'
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500'
                    />
                    <div className='max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-slate-900'>
                        {postResults.length > 0 ? (
                            <ul className='divide-y divide-gray-200 dark:divide-gray-700'>
                                {postResults.map((post) => (
                                    <li key={post.id}>
                                        <button
                                            onClick={() =>
                                                handleSelectPost(post)
                                            }
                                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ${
                                                selectedItem?.type === 'post' &&
                                                selectedItem?.id === post.id
                                                    ? 'bg-purple-100 dark:bg-purple-900'
                                                    : ''
                                            }`}
                                        >
                                            <div className='flex items-start justify-between gap-2'>
                                                <div className='flex-1 min-w-0'>
                                                    <div className='font-medium text-sm text-gray-900 dark:text-white truncate'>
                                                        {post.title ||
                                                            'Untitled'}
                                                    </div>
                                                    <div className='text-xs text-gray-600 dark:text-gray-400 line-clamp-2'>
                                                        {post.body?.substring(
                                                            0,
                                                            80
                                                        )}
                                                        ...
                                                    </div>
                                                </div>
                                                <span
                                                    className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                                                        post.type === 'gift'
                                                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                            : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                                    }`}
                                                >
                                                    {post.type}
                                                </span>
                                            </div>
                                            <div className='text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1'>
                                                <div>
                                                    ID: {post.id} •{' '}
                                                    {post.category?.name ||
                                                        'No category'}
                                                </div>
                                                <div>
                                                    {post.sender?.username && (
                                                        <span>
                                                            By @
                                                            {
                                                                post.sender
                                                                    .username
                                                            }
                                                        </span>
                                                    )}
                                                    {post.handshakes &&
                                                        post.handshakes.length >
                                                            0 && (
                                                        <span>
                                                            {' '}
                                                                •{' '}
                                                            {
                                                                post
                                                                    .handshakes
                                                                    .length
                                                            }{' '}
                                                                response(s)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className='px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm'>
                                {postQuery.length < 2
                                    ? 'Type at least 2 characters...'
                                    : 'No posts found'}
                            </div>
                        )}
                    </div>
                </div>

                {/* User Search */}
                <div className='space-y-3'>
                    <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        Search Users
                    </label>
                    <input
                        type='text'
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        placeholder='Search users (min 2 chars)...'
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500'
                    />
                    <div className='max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-slate-900'>
                        {userResults.length > 0 ? (
                            <ul className='divide-y divide-gray-200 dark:divide-gray-700'>
                                {userResults.map((user) => (
                                    <li key={user.id}>
                                        <button
                                            onClick={() =>
                                                handleSelectUser(user)
                                            }
                                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ${
                                                selectedItem?.type === 'user' &&
                                                selectedItem?.id === user.id
                                                    ? 'bg-purple-100 dark:bg-purple-900'
                                                    : ''
                                            }`}
                                        >
                                            <div className='font-medium text-sm text-gray-900 dark:text-white'>
                                                {user.displayName ||
                                                    user.username}
                                            </div>
                                            <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                @{user.username} (ID: {user.id})
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className='px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm'>
                                {userQuery.length < 2
                                    ? 'Type at least 2 characters...'
                                    : 'No users found'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dev Menu for Selected Item */}
            {selectedItem && (
                <div className='bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4'>
                    <div className='mb-4 pb-4 border-b border-purple-200 dark:border-purple-700'>
                        {isPost && (
                            <div>
                                <h4 className='font-semibold text-purple-900 dark:text-purple-200 mb-2'>
                                    Post: {(selectedItem.data as PostDTO).title}
                                </h4>
                                <div className='text-xs space-y-1 text-gray-600 dark:text-gray-400'>
                                    <div>
                                        <span className='font-medium'>ID:</span>{' '}
                                        {selectedItem.id}
                                    </div>
                                    <div>
                                        <span className='font-medium'>
                                            Type:
                                        </span>{' '}
                                        {(selectedItem.data as PostDTO).type ||
                                            'unknown'}
                                    </div>
                                    <div>
                                        <span className='font-medium'>
                                            Created:
                                        </span>{' '}
                                        {new Date(
                                            (selectedItem.data as PostDTO)
                                                .createdAt
                                        ).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        )}
                        {isUser && (
                            <div>
                                <h4 className='font-semibold text-purple-900 dark:text-purple-200 mb-2'>
                                    User:{' '}
                                    {(selectedItem.data as UserDTO)
                                        .displayName ||
                                        (selectedItem.data as UserDTO).username}
                                </h4>
                                <div className='text-xs space-y-1 text-gray-600 dark:text-gray-400'>
                                    <div>
                                        <span className='font-medium'>ID:</span>{' '}
                                        {selectedItem.id}
                                    </div>
                                    <div>
                                        <span className='font-medium'>
                                            Username:
                                        </span>{' '}
                                        {
                                            (selectedItem.data as UserDTO)
                                                .username
                                        }
                                    </div>
                                    <div>
                                        <span className='font-medium'>
                                            Email:
                                        </span>{' '}
                                        {(selectedItem.data as UserDTO).email ||
                                            'N/A'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='space-y-2'>
                        <h5 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3'>
                            Dev Actions
                        </h5>
                        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                            <button className='px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded transition-colors'>
                                Copy ID
                            </button>
                            <button className='px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded transition-colors'>
                                View Full
                            </button>
                            <button className='px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded transition-colors'>
                                Copy JSON
                            </button>
                            <button className='px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded transition-colors'>
                                More Options
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setSelectedItem(null)}
                        className='mt-4 w-full px-3 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium rounded transition-colors'
                    >
                        Clear Selection
                    </button>
                </div>
            )}
        </div>
    );
}
