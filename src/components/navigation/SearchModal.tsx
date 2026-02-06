import React, { Fragment, useState, useEffect } from 'react';
import {
    Dialog,
    DialogPanel,
    DialogBackdrop,
    TransitionChild
} from '@headlessui/react';
import {
    MagnifyingGlassIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSearchPostsQuery } from '@/shared/api/queries/posts';
import { useSearchUsersQuery } from '@/shared/api/queries/users';
import { useSearchEventsQuery } from '@/shared/api/queries/events';
import { getImagePath } from '@/shared/api/config';

interface SearchModalProps {
    open: boolean;
    onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);
    const debouncedSearch = useDebouncedValue(searchText, 300);

    const searchingActive = debouncedSearch.length >= 2;

    const postsQuery = useSearchPostsQuery(debouncedSearch);
    const searchResults = postsQuery.data?.pages.flat() ?? [];
    const searching = postsQuery.isFetching;
    const { data: userSearchResults = [], isFetching: searchingUsers } =
        useSearchUsersQuery(debouncedSearch);
    const eventsQuery = useSearchEventsQuery(debouncedSearch);
    const eventSearchResults = eventsQuery.data?.pages.flat() ?? [];
    const searchingEvents = eventsQuery.isLoading;

    const hasResults = userSearchResults.length > 0 || searchResults.length > 0 || eventSearchResults.length > 0;

    // Reset search when modal closes, and focus input when modal opens
    useEffect(() => {
        if (!open) {
            setSearchText('');
        }
        else {
            // Focus input after modal animation completes (300ms based on the transition duration)
            // This will automatically trigger the mobile keyboard
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    // Ensure cursor is at the end and input is ready
                    inputRef.current.setSelectionRange(0, 0);
                }
            }, 300);
        }
    }, [open]);

    const handleResultClick = () => {
        onClose();
    };

    const handleShowAllResults = () => {
        navigate(`/search?q=${encodeURIComponent(searchText)}`);
        onClose();
    };

    // Format date for events
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <Dialog open={open} onClose={onClose} className='relative z-50'>
            {/* Backdrop */}
            <TransitionChild
                as={Fragment}
                enter='transition-opacity ease-linear duration-300'
                enterFrom='opacity-0'
                enterTo='opacity-100'
                leave='transition-opacity ease-linear duration-200'
                leaveFrom='opacity-100'
                leaveTo='opacity-0'
            >
                <DialogBackdrop className='fixed inset-0 bg-black/50 backdrop-blur-sm' />
            </TransitionChild>

            {/* Modal Panel */}
            <div className='fixed inset-0 flex items-start justify-center p-4 pt-20'>
                <TransitionChild
                    as={Fragment}
                    enter='transform transition ease-out duration-300'
                    enterFrom='opacity-0 scale-95 -translate-y-4'
                    enterTo='opacity-100 scale-100 translate-y-0'
                    leave='transform transition ease-in duration-200'
                    leaveFrom='opacity-100 scale-100 translate-y-0'
                    leaveTo='opacity-0 scale-95 -translate-y-4'
                >
                    <DialogPanel className='relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]'>
                        {/* Search Bar - Fixed at top */}
                        <div className='flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-zinc-800'>
                            <div className='relative'>
                                <MagnifyingGlassIcon className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                                <input
                                    ref={inputRef}
                                    type='text'
                                    placeholder='Search users, posts, events…'
                                    value={searchText}
                                    onChange={(e) =>
                                        setSearchText(e.target.value)
                                    }
                                    className='w-full pl-12 pr-10 py-3 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all'
                                    autoFocus
                                />
                                {searchText && (
                                    <button
                                        onClick={() => setSearchText('')}
                                        className='absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors'
                                        aria-label='Clear search'
                                    >
                                        <X className='w-4 h-4 text-gray-500 dark:text-gray-400' />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Show All Results - Visible when there are results */}
                        {searchingActive && hasResults && (
                            <div className='flex-shrink-0 px-6 py-3 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800'>
                                <button
                                    onClick={handleShowAllResults}
                                    className='flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors'
                                >
                                    Show all results
                                    <ArrowRightIcon className='h-4 w-4' />
                                </button>
                            </div>
                        )}

                        {/* Search Results - Scrollable */}
                        <div className='flex-1 overflow-y-auto'>
                            {!searchingActive ? (
                                <div className='text-center py-12 text-gray-500 dark:text-zinc-400'>
                                    <MagnifyingGlassIcon className='h-12 w-12 mx-auto mb-3 opacity-50' />
                                    <p>Start typing to search</p>
                                </div>
                            ) : searching || searchingUsers || searchingEvents ? (
                                <div className='text-center py-12 text-gray-500 dark:text-zinc-400'>
                                    Searching...
                                </div>
                            ) : !hasResults ? (
                                <div className='text-center py-12 text-gray-500 dark:text-zinc-400'>
                                    No results found
                                </div>
                            ) : (
                                <div className='p-6 space-y-6'>
                                    {/* User Results */}
                                    {userSearchResults.length > 0 && (
                                        <div>
                                            <h3 className='text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide mb-3'>
                                                Users
                                            </h3>
                                            <div className='space-y-2'>
                                                {userSearchResults
                                                    .slice(0, 3)
                                                    .map((user) => (
                                                        <Link
                                                            key={user.id}
                                                            to={`/user/${user.id}`}
                                                            onClick={
                                                                handleResultClick
                                                            }
                                                            className='flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors'
                                                        >
                                                            <img
                                                                src={getImagePath(
                                                                    user.avatar
                                                                )}
                                                                alt={
                                                                    user.username
                                                                }
                                                                className='w-12 h-12 rounded-full object-cover'
                                                            />
                                                            <div className='flex-1 min-w-0'>
                                                                <p className='font-medium text-gray-900 dark:text-zinc-100 truncate'>
                                                                    {user.displayName ||
                                                                        user.username}
                                                                </p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Post Results */}
                                    {searchResults.length > 0 && (
                                        <div>
                                            <h3 className='text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide mb-3'>
                                                Posts
                                            </h3>
                                            <div className='space-y-2'>
                                                {searchResults
                                                    .slice(0, 3)
                                                    .map((post) => (
                                                        <Link
                                                            key={post.id}
                                                            to={`/post/${post.id}`}
                                                            onClick={
                                                                handleResultClick
                                                            }
                                                            className='flex items-start gap-3 p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors'
                                                        >
                                                            <img
                                                                src={getImagePath(
                                                                    post.sender
                                                                        ?.avatar
                                                                )}
                                                                alt={
                                                                    post.sender
                                                                        ?.username ||
                                                                    'User'
                                                                }
                                                                className='w-10 h-10 rounded-full object-cover flex-shrink-0'
                                                            />
                                                            <div className='flex-1 min-w-0'>
                                                                <p className='text-sm text-gray-500 dark:text-zinc-400 mb-1'>
                                                                    {post.sender
                                                                        ?.displayName ||
                                                                        post
                                                                            .sender
                                                                            ?.username}
                                                                </p>
                                                                <p className='font-medium text-gray-900 dark:text-zinc-100 truncate'>
                                                                    {post.title}
                                                                </p>
                                                                {post.body && (
                                                                    <p className='text-sm text-gray-500 dark:text-zinc-400 line-clamp-2 mt-1'>
                                                                        {
                                                                            post.body
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </Link>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Event Results */}
                                    {eventSearchResults.length > 0 && (
                                        <div>
                                            <h3 className='text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide mb-3'>
                                                Events
                                            </h3>
                                            <div className='space-y-2'>
                                                {eventSearchResults.slice(0, 3).map((event) => (
                                                    <Link
                                                        key={event.id}
                                                        to={`/event/${event.id}`}
                                                        onClick={handleResultClick}
                                                        className='block p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors'
                                                    >
                                                        <p className='font-medium text-gray-900 dark:text-zinc-100 truncate'>
                                                            {event.title}
                                                        </p>
                                                        <div className='flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-zinc-400 flex-wrap'>
                                                            {event.location?.name && (
                                                                <span className='truncate'>📍 {event.location.name}</span>
                                                            )}
                                                            {event.startTime && (
                                                                <>
                                                                    {event.location?.name && <span>•</span>}
                                                                    <span>{formatDate(event.startTime)}</span>
                                                                </>
                                                            )}
                                                            {event.endTime && (
                                                                <>
                                                                    <span>→</span>
                                                                    <span>{formatDate(event.endTime)}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </DialogPanel>
                </TransitionChild>
            </div>
        </Dialog>
    );
}
