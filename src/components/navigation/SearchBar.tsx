import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSearchPostsQuery } from '@/shared/api/queries/posts';
import { useSearchUsersQuery } from '@/shared/api/queries/users';
import { useEvents } from '@/shared/api/queries/events';
import { getImagePath } from '@/shared/api/config';

interface SearchBarProps {
    onClose?: () => void;
    autoFocus?: boolean;
    className?: string;
}

export default function SearchBar({ onClose, autoFocus = false, className = '' }: SearchBarProps) {
    const navigate = useNavigate();
    const [searchText, setSearchText] = React.useState('');
    const [showSearchDropdown, setShowSearchDropdown] = React.useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debouncedSearch = useDebouncedValue(searchText, 300);

    const searchingActive = debouncedSearch.length >= 2;

    const { data: searchResults = [], isFetching: searching } =
        useSearchPostsQuery(debouncedSearch);

    const { data: userSearchResults = [], isFetching: searchingUsers } =
        useSearchUsersQuery(debouncedSearch);

    const { data: allEvents = [] } = useEvents();

    // Filter events client-side based on search text
    const eventSearchResults = React.useMemo(() => {
        if (!searchingActive) return [];
        const searchLower = debouncedSearch.toLowerCase();
        return allEvents.filter(event =>
            event.title.toLowerCase().includes(searchLower) ||
            event.description.toLowerCase().includes(searchLower) ||
            event.location?.name?.toLowerCase().includes(searchLower)
        );
    }, [debouncedSearch, allEvents, searchingActive]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchDropdown(false);
            }
        }

        if (showSearchDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSearchDropdown]);

    // Show dropdown when there are search results
    useEffect(() => {
        if (searchingActive && (userSearchResults.length > 0 || searchResults.length > 0 || eventSearchResults.length > 0)) {
            setShowSearchDropdown(true);
        }
    }, [searchingActive, userSearchResults.length, searchResults.length, eventSearchResults.length]);

    const handleResultClick = () => {
        setShowSearchDropdown(false);
        onClose?.();
    };

    return (
        <div className={`relative ${className}`} ref={searchRef}>
            <input
                type='text'
                placeholder='Search…'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => {
                    if (searchingActive && (userSearchResults.length > 0 || searchResults.length > 0 || eventSearchResults.length > 0)) {
                        setShowSearchDropdown(true);
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchText.trim()) {
                        e.preventDefault();
                        navigate(`/search?q=${encodeURIComponent(searchText.trim())}`);
                        setShowSearchDropdown(false);
                        onClose?.();
                    }
                }}
                className='w-full px-4 py-2 pr-10 lg:px-6 lg:py-3 lg:text-lg rounded-full bg-white/90 dark:bg-zinc-800/90 text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 shadow-lg backdrop-blur-sm ring-1 ring-zinc-900/5 dark:ring-white/10 focus:outline-none focus:ring-zinc-900/10 dark:focus:ring-white/20 transition-all'
                autoFocus={autoFocus}
            />
            {searchText && (
                <button
                    onClick={() => {
                        setSearchText('');
                        setShowSearchDropdown(false);
                    }}
                    className='absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors'
                    aria-label='Clear search'
                >
                    <X className='w-4 h-4 lg:w-5 lg:h-5 text-gray-500 dark:text-gray-400' />
                </button>
            )}

            {/* Search Results Dropdown */}
            {showSearchDropdown && searchingActive && (
                <div className='absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-gray-200 dark:border-zinc-700 max-h-[70vh] overflow-y-auto overflow-x-hidden z-[60]'>
                    <div className='p-3 space-y-3 w-full'>
                        {/* Search Results */}
                        <div className='space-y-3'>
                            {/* User Results */}
                            {userSearchResults.length > 0 && (
                                <div className='space-y-2'>
                                    <h3 className='text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase px-2'>Users</h3>
                                    {userSearchResults.slice(0, 3).map((user) => (
                                        <Link
                                            key={user.id}
                                            to={`/user/${user.id}`}
                                            onClick={handleResultClick}
                                            className='flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors'
                                        >
                                            <img
                                                src={getImagePath(user.avatar)}
                                                alt={user.username}
                                                className='w-10 h-10 rounded-full object-cover'
                                            />
                                            <div className='flex-1 min-w-0'>
                                                <p className='font-medium text-gray-900 dark:text-zinc-100 truncate'>
                                                    {user.displayName || user.username}
                                                </p>
                                                {user.displayName && (
                                                    <p className='text-sm text-gray-500 dark:text-zinc-400 truncate'>
                                                        @{user.username}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Post Results */}
                            {searchResults.length > 0 && (
                                <div className='space-y-2'>
                                    <h3 className='text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase px-2'>Posts</h3>
                                    {searchResults.slice(0, 3).map((post) => (
                                        <Link
                                            key={post.id}
                                            to={`/post/${post.id}`}
                                            onClick={handleResultClick}
                                            className='block p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors'
                                        >
                                            <p className='font-medium text-gray-900 dark:text-zinc-100 truncate'>
                                                {post.title}
                                            </p>
                                            {post.body && (
                                                <p className='text-sm text-gray-500 dark:text-zinc-400 line-clamp-1'>
                                                    {post.body}
                                                </p>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Event Results */}
                            {eventSearchResults.length > 0 && (
                                <div className='space-y-2'>
                                    <h3 className='text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase px-2'>Events</h3>
                                    {eventSearchResults.slice(0, 3).map((event) => (
                                        <Link
                                            key={event.id}
                                            to={`/event/${event.id}`}
                                            onClick={handleResultClick}
                                            className='block p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors'
                                        >
                                            <p className='font-medium text-gray-900 dark:text-zinc-100 truncate'>
                                                {event.title}
                                            </p>
                                            {event.location?.name && (
                                                <p className='text-sm text-gray-500 dark:text-zinc-400 truncate'>
                                                    📍 {event.location.name}
                                                </p>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* No Results */}
                            {!searching && !searchingUsers &&
                                userSearchResults.length === 0 &&
                                searchResults.length === 0 &&
                                eventSearchResults.length === 0 && (
                                <div className='text-center py-8 text-gray-500 dark:text-zinc-400'>
                                    No results found
                                </div>
                            )}

                            {/* Loading */}
                            {(searching || searchingUsers) && (
                                <div className='text-center py-8 text-gray-500 dark:text-zinc-400'>
                                    Searching...
                                </div>
                            )}
                        </div>

                        {/* Show All Results Button */}
                        {(userSearchResults.length > 0 || searchResults.length > 0 || eventSearchResults.length > 0) && (
                            <div className='border-t dark:border-zinc-700 pt-2'>
                                <button
                                    onClick={() => {
                                        navigate(`/search?q=${encodeURIComponent(searchText)}`);
                                        setShowSearchDropdown(false);
                                        onClose?.();
                                    }}
                                    className='w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium'
                                >
                                    Show all results →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
