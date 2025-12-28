import React, { useState, useEffect, useRef } from 'react';
import { apiMutate, apiGet } from '@/shared/api/apiClient';
import type { PostDTO, EventDTO, UserDTO, MessageDTO } from '@/shared/api/types';

type TargetType = 'post' | 'event';
type PostTypeFilter = 'all' | 'gift' | 'request';

interface CreatedComment extends MessageDTO {
    userName?: string;
    targetType: TargetType;
    targetTitle?: string;
}

const RANDOM_COMMENTS = [
    'This is a test comment for debugging purposes.',
    'Great post! Thanks for sharing.',
    'I have a question about this...',
    'Very helpful, appreciate it!',
    'Interesting, tell me more.',
    'Count me in!',
    'This is exactly what I was looking for.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Can someone help me understand this better?',
    'Testing the comment system here.',
];

const RANDOM_POST_TITLES = [
    'Test Post', 'Quick Offer', 'Need Help', 'Sharing This', 'Looking For',
    'Can Provide', 'Seeking', 'Available Now', 'Free Stuff', 'Request'
];

const RANDOM_POST_BODIES = [
    'This is a test post for comment testing',
    'Lorem ipsum dolor sit amet',
    'Need assistance with this',
    'Happy to share this with the community',
    'Looking for someone to help'
];

const RANDOM_EVENT_TITLES = [
    'Community Meetup', 'Workshop Session', 'Online Discussion', 'Local Gathering',
    'Test Event', 'Group Activity', 'Weekly Check-in', 'Special Event'
];

const RANDOM_EVENT_DESCRIPTIONS = [
    'Join us for a community event!',
    'A test event for debugging purposes.',
    'Come meet other members of the community.',
    'Online session to discuss various topics.',
    'A fun activity for everyone!'
];

export default function AddCommentsSection() {
    // Target selection (post or event)
    const [targetType, setTargetType] = useState<TargetType>('post');
    const [selectedPost, setSelectedPost] = useState<PostDTO | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null);
    const [recentPosts, setRecentPosts] = useState<PostDTO[]>([]);
    const [recentEvents, setRecentEvents] = useState<EventDTO[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<(PostDTO | EventDTO)[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(false);
    const [searching, setSearching] = useState(false);
    const [postTypeFilter, setPostTypeFilter] = useState<PostTypeFilter>('all');
    const [creatingRandomTarget, setCreatingRandomTarget] = useState(false);

    // User selection
    const [recentUsers, setRecentUsers] = useState<UserDTO[]>([]);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userSearchResults, setUserSearchResults] = useState<UserDTO[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);

    // Comment content
    const [commentContent, setCommentContent] = useState('');
    const [useRandomContent, setUseRandomContent] = useState(true);

    // Created comments
    const [creatingComment, setCreatingComment] = useState(false);
    const [createdComments, setCreatedComments] = useState<CreatedComment[]>([]);

    // Ref for scrolling to user section
    const userSectionRef = useRef<HTMLDivElement>(null);

    // Fetch recent posts/events on mount and when target type/filter changes
    useEffect(() => {
        if (targetType === 'post') {
            fetchRecentPosts();
        }
        else {
            fetchRecentEvents();
        }
    }, [targetType, postTypeFilter]);

    useEffect(() => {
        fetchRecentUsers();
    }, []);

    // Scroll to user section when a target is selected
    useEffect(() => {
        if ((selectedPost || selectedEvent) && userSectionRef.current) {
            setTimeout(() => {
                userSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [selectedPost, selectedEvent]);

    const fetchRecentPosts = async () => {
        setLoadingTargets(true);
        try {
            const posts = await apiGet<PostDTO[]>('/dev/posts');
            let filteredPosts = posts || [];

            if (postTypeFilter !== 'all') {
                filteredPosts = filteredPosts.filter(p => p.type === postTypeFilter);
            }

            setRecentPosts(filteredPosts.slice(0, 10));
        }
        catch (err) {
            console.error('Failed to fetch recent posts:', err);
        }
        finally {
            setLoadingTargets(false);
        }
    };

    const fetchRecentEvents = async () => {
        setLoadingTargets(true);
        try {
            const events = await apiGet<EventDTO[]>('/events');
            setRecentEvents((events || []).slice(0, 10));
        }
        catch (err) {
            console.error('Failed to fetch recent events:', err);
        }
        finally {
            setLoadingTargets(false);
        }
    };

    const fetchRecentUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await apiGet<{ data: UserDTO[] }>('/users', { params: { limit: 10 } });
            setRecentUsers(response.data || []);
        }
        catch (err) {
            console.error('Failed to fetch recent users:', err);
        }
        finally {
            setLoadingUsers(false);
        }
    };

    const searchTargets = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            if (targetType === 'post') {
                const results = await apiGet<PostDTO[]>('/posts/search', { params: { q: searchQuery, limit: 5 } });
                setSearchResults(results || []);
            }
            else {
                const results = await apiGet<EventDTO[]>('/events/search', { params: { q: searchQuery, limit: 5 } });
                setSearchResults(results || []);
            }
        }
        catch (err) {
            console.error('Failed to search:', err);
        }
        finally {
            setSearching(false);
        }
    };

    const searchUsers = async () => {
        if (!userSearchQuery.trim()) return;
        setSearchingUsers(true);
        try {
            const results = await apiGet<UserDTO[]>('/users/search', { params: { q: userSearchQuery, limit: 5 } });
            setUserSearchResults(results || []);
        }
        catch (err) {
            console.error('Failed to search users:', err);
        }
        finally {
            setSearchingUsers(false);
        }
    };

    const selectRandomTarget = async () => {
        setLoadingTargets(true);
        try {
            if (targetType === 'post') {
                const posts = await apiGet<PostDTO[]>('/dev/posts');
                let filteredPosts = posts || [];
                if (postTypeFilter !== 'all') {
                    filteredPosts = filteredPosts.filter(p => p.type === postTypeFilter);
                }
                if (filteredPosts.length > 0) {
                    const randomPost = filteredPosts[Math.floor(Math.random() * filteredPosts.length)];
                    setSelectedPost(randomPost);
                    setSelectedEvent(null);
                }
            }
            else {
                const events = await apiGet<EventDTO[]>('/events');
                const eventList = events || [];
                if (eventList.length > 0) {
                    const randomEvent = eventList[Math.floor(Math.random() * eventList.length)];
                    setSelectedEvent(randomEvent);
                    setSelectedPost(null);
                }
            }
        }
        catch (err) {
            console.error('Failed to fetch random target:', err);
        }
        finally {
            setLoadingTargets(false);
        }
    };

    const createRandomPost = async (postType: 'gift' | 'request') => {
        setCreatingRandomTarget(true);
        try {
            const randomTitle = RANDOM_POST_TITLES[Math.floor(Math.random() * RANDOM_POST_TITLES.length)];
            const randomBody = RANDOM_POST_BODIES[Math.floor(Math.random() * RANDOM_POST_BODIES.length)];

            const usersResponse = await apiGet<{ data: UserDTO[] }>('/users', { params: { limit: 20 } });
            const users = usersResponse.data || [];
            const randomUser = users.length > 0 ? users[Math.floor(Math.random() * users.length)] : null;

            if (!randomUser) {
                alert('No users available to create post');
                return;
            }

            const postData = {
                title: `${randomTitle} #${Date.now().toString(36)}`,
                body: randomBody,
                type: postType,
                categoryID: 1,
                userId: randomUser.id
            };

            const post = await apiMutate<PostDTO, any>('/dev/posts/as-user', 'post', postData, { as: 'form' });
            setSelectedPost(post);
            setSelectedEvent(null);
            await fetchRecentPosts();
        }
        catch (err: any) {
            console.error('Failed to create random post:', err);
            alert(`Failed to create post: ${err?.message || err}`);
        }
        finally {
            setCreatingRandomTarget(false);
        }
    };

    const createRandomEvent = async () => {
        setCreatingRandomTarget(true);
        try {
            const randomTitle = RANDOM_EVENT_TITLES[Math.floor(Math.random() * RANDOM_EVENT_TITLES.length)];
            const randomDesc = RANDOM_EVENT_DESCRIPTIONS[Math.floor(Math.random() * RANDOM_EVENT_DESCRIPTIONS.length)];

            const usersResponse = await apiGet<{ data: UserDTO[] }>('/users', { params: { limit: 20 } });
            const users = usersResponse.data || [];
            const randomUser = users.length > 0 ? users[Math.floor(Math.random() * users.length)] : null;

            if (!randomUser) {
                alert('No users available to create event');
                return;
            }

            const now = new Date();
            const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
            const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

            const eventData = {
                title: `${randomTitle} #${Date.now().toString(36)}`,
                description: randomDesc,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                userId: randomUser.id,
                location: null
            };

            const event = await apiMutate<EventDTO, any>('/dev/events/as-user', 'post', eventData);
            setSelectedEvent(event);
            setSelectedPost(null);
            await fetchRecentEvents();
        }
        catch (err: any) {
            console.error('Failed to create random event:', err);
            alert(`Failed to create event: ${err?.message || err}`);
        }
        finally {
            setCreatingRandomTarget(false);
        }
    };

    const getRandomComment = () => {
        return RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)];
    };

    const createComment = async () => {
        if (!selectedUser) {
            alert('Please select a user to post as');
            return;
        }
        if (!selectedPost && !selectedEvent) {
            alert('Please select a post or event to comment on');
            return;
        }

        const content = useRandomContent ? getRandomComment() : commentContent;
        if (!content.trim()) {
            alert('Please enter comment content');
            return;
        }

        setCreatingComment(true);
        try {
            const messageData: any = {
                content,
                authorID: selectedUser.id,
            };

            if (selectedPost) {
                messageData.postID = selectedPost.id;
            }
            else if (selectedEvent) {
                messageData.eventID = selectedEvent.id;
            }

            // Use dev endpoint for impersonation
            const message = await apiMutate<MessageDTO, any>('/dev/messages/as-user', 'post', {
                ...messageData,
                userId: selectedUser.id
            });

            setCreatedComments(prev => [...prev, {
                ...message,
                userName: selectedUser.displayName || selectedUser.username || `User #${selectedUser.id}`,
                targetType: selectedPost ? 'post' : 'event',
                targetTitle: selectedPost?.title || selectedEvent?.title
            }]);

            // Reset content if using custom
            if (!useRandomContent) {
                setCommentContent('');
            }
        }
        catch (err: any) {
            console.error('Failed to create comment:', err);
            alert(`Failed to create comment: ${err?.message || err}`);
        }
        finally {
            setCreatingComment(false);
        }
    };

    const deleteComment = async (commentId: number) => {
        if (!confirm('Delete this comment?')) return;

        try {
            await apiMutate(`/messages/${commentId}`, 'delete');
            setCreatedComments(prev => prev.filter(c => c.id !== commentId));
        }
        catch (err: any) {
            console.error('Failed to delete comment:', err);
            alert(`Failed to delete comment: ${err?.message || err}`);
        }
    };

    const PostItem = ({ post, isSelected, onSelect }: { post: PostDTO; isSelected: boolean; onSelect: () => void }) => (
        <button
            onClick={onSelect}
            className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                isSelected
                    ? 'bg-purple-100 dark:bg-purple-900 border-2 border-purple-500'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
            <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{post.title}</div>
            <div className="text-gray-500 dark:text-gray-400 flex gap-2 mt-0.5">
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${post.type === 'gift' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'}`}>
                    {post.type}
                </span>
                <span>#{post.id}</span>
                <span>by User #{post.senderID}</span>
            </div>
        </button>
    );

    const EventItem = ({ event, isSelected, onSelect }: { event: EventDTO; isSelected: boolean; onSelect: () => void }) => (
        <button
            onClick={onSelect}
            className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                isSelected
                    ? 'bg-purple-100 dark:bg-purple-900 border-2 border-purple-500'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
            <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{event.title}</div>
            <div className="text-gray-500 dark:text-gray-400 flex gap-2 mt-0.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                    event
                </span>
                <span>#{event.id}</span>
                {event.creatorID && <span>by User #{event.creatorID}</span>}
            </div>
        </button>
    );

    const UserItem = ({ user, isSelected, onSelect }: { user: UserDTO; isSelected: boolean; onSelect: () => void }) => (
        <button
            onClick={onSelect}
            className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                isSelected
                    ? 'bg-purple-100 dark:bg-purple-900 border-2 border-purple-500'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
            <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
                {user.displayName || user.username || `User #${user.id}`}
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-[10px]">
                #{user.id} {user.username && `@${user.username}`}
            </div>
        </button>
    );

    const CommentCard = ({ comment }: { comment: CreatedComment }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-xs">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {comment.userName}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        comment.targetType === 'post'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                    }`}>
                        {comment.targetType}
                    </span>
                </div>
                <button
                    onClick={() => deleteComment(comment.id)}
                    className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded text-[10px]"
                >
                    Delete
                </button>
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-[10px] mb-1">
                on: {comment.targetTitle}
            </div>
            <div className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-750 p-2 rounded">
                {comment.content}
            </div>
        </div>
    );

    const selectedTarget = selectedPost || selectedEvent;

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Add Comments</h3>

            {/* Target Type Selection */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Comment on
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setTargetType('post');
                            setSelectedEvent(null);
                            setSearchResults([]);
                            setSearchQuery('');
                        }}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            targetType === 'post'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                        Post
                    </button>
                    <button
                        onClick={() => {
                            setTargetType('event');
                            setSelectedPost(null);
                            setSearchResults([]);
                            setSearchQuery('');
                        }}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            targetType === 'event'
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                        Event
                    </button>
                </div>
            </div>

            {/* Target Selection */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Select {targetType === 'post' ? 'Post' : 'Event'}
                    </label>
                    <div className="flex gap-1">
                        {targetType === 'post' ? (
                            <>
                                <button
                                    onClick={() => createRandomPost('gift')}
                                    disabled={creatingRandomTarget}
                                    className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50"
                                    title="Create a new gift post"
                                >
                                    {creatingRandomTarget ? '...' : '+ Gift'}
                                </button>
                                <button
                                    onClick={() => createRandomPost('request')}
                                    disabled={creatingRandomTarget}
                                    className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
                                    title="Create a new request post"
                                >
                                    {creatingRandomTarget ? '...' : '+ Req'}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={createRandomEvent}
                                disabled={creatingRandomTarget}
                                className="px-2 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50"
                                title="Create a new event"
                            >
                                {creatingRandomTarget ? '...' : '+ Event'}
                            </button>
                        )}
                        <button
                            onClick={selectRandomTarget}
                            disabled={loadingTargets}
                            className="px-2 py-1 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded disabled:opacity-50"
                        >
                            {loadingTargets ? '...' : 'Rnd'}
                        </button>
                    </div>
                </div>

                {/* Post Type Filter (only for posts) */}
                {targetType === 'post' && (
                    <div className="flex gap-1 items-center flex-wrap">
                        <button
                            onClick={() => setPostTypeFilter('all')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                                postTypeFilter === 'all'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setPostTypeFilter('gift')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                                postTypeFilter === 'gift'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Gifts
                        </button>
                        <button
                            onClick={() => setPostTypeFilter('request')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                                postTypeFilter === 'request'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Requests
                        </button>
                    </div>
                )}

                {/* Search */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchTargets()}
                        placeholder={`Search ${targetType}s...`}
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    />
                    <button
                        onClick={searchTargets}
                        disabled={searching || !searchQuery.trim()}
                        className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded disabled:opacity-50"
                    >
                        {searching ? '...' : 'Search'}
                    </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="space-y-1">
                        <div className="text-[10px] text-gray-500 uppercase">Search Results</div>
                        {searchResults.map(item => (
                            targetType === 'post' ? (
                                <PostItem
                                    key={item.id}
                                    post={item as PostDTO}
                                    isSelected={selectedPost?.id === item.id}
                                    onSelect={() => {
                                        setSelectedPost(item as PostDTO);
                                        setSelectedEvent(null);
                                        setSearchResults([]);
                                        setSearchQuery('');
                                    }}
                                />
                            ) : (
                                <EventItem
                                    key={item.id}
                                    event={item as EventDTO}
                                    isSelected={selectedEvent?.id === item.id}
                                    onSelect={() => {
                                        setSelectedEvent(item as EventDTO);
                                        setSelectedPost(null);
                                        setSearchResults([]);
                                        setSearchQuery('');
                                    }}
                                />
                            )
                        ))}
                    </div>
                )}

                {/* Recent Items */}
                <div className="space-y-1">
                    <div className="text-[10px] text-gray-500 uppercase">
                        Recent {targetType === 'post' ? 'Posts' : 'Events'}
                    </div>
                    {loadingTargets ? (
                        <div className="text-xs text-gray-400">Loading...</div>
                    ) : targetType === 'post' ? (
                        recentPosts.length > 0 ? (
                            recentPosts.map(post => (
                                <PostItem
                                    key={post.id}
                                    post={post}
                                    isSelected={selectedPost?.id === post.id}
                                    onSelect={() => {
                                        setSelectedPost(post);
                                        setSelectedEvent(null);
                                    }}
                                />
                            ))
                        ) : (
                            <div className="text-xs text-gray-400">No recent posts found</div>
                        )
                    ) : (
                        recentEvents.length > 0 ? (
                            recentEvents.map(event => (
                                <EventItem
                                    key={event.id}
                                    event={event}
                                    isSelected={selectedEvent?.id === event.id}
                                    onSelect={() => {
                                        setSelectedEvent(event);
                                        setSelectedPost(null);
                                    }}
                                />
                            ))
                        ) : (
                            <div className="text-xs text-gray-400">No recent events found</div>
                        )
                    )}
                </div>

                {/* Selected Target Preview */}
                {selectedTarget && (
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg border-2 border-purple-400 dark:border-purple-600 shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Selected:</span>
                            <button
                                onClick={() => {
                                    setSelectedPost(null);
                                    setSelectedEvent(null);
                                }}
                                className="text-xs text-red-500 hover:text-red-700"
                            >
                                Clear
                            </button>
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                            #{selectedTarget.id} - {selectedTarget.title}
                            {selectedPost && ` (${selectedPost.type})`}
                        </div>

                        {/* Scroll indicator */}
                        <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-700 flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400">
                            <span className="text-xs font-medium">Continue below to add comments</span>
                            <span className="animate-bounce text-lg">↓</span>
                        </div>
                    </div>
                )}
            </div>

            {/* User Selection */}
            {selectedTarget && (
                <div ref={userSectionRef} className="space-y-2 scroll-mt-4">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Comment as User
                    </label>

                    {/* User Search */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                            placeholder="Search users..."
                            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                        />
                        <button
                            onClick={searchUsers}
                            disabled={searchingUsers || !userSearchQuery.trim()}
                            className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded disabled:opacity-50"
                        >
                            {searchingUsers ? '...' : 'Search'}
                        </button>
                    </div>

                    {/* User Search Results */}
                    {userSearchResults.length > 0 && (
                        <div className="space-y-1">
                            <div className="text-[10px] text-gray-500 uppercase">Search Results</div>
                            {userSearchResults.map(user => (
                                <UserItem
                                    key={user.id}
                                    user={user}
                                    isSelected={selectedUser?.id === user.id}
                                    onSelect={() => {
                                        setSelectedUser(user);
                                        setUserSearchResults([]);
                                        setUserSearchQuery('');
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Recent Users */}
                    <div className="space-y-1">
                        <div className="text-[10px] text-gray-500 uppercase">Recent Users</div>
                        {loadingUsers ? (
                            <div className="text-xs text-gray-400">Loading...</div>
                        ) : recentUsers.length > 0 ? (
                            recentUsers.map(user => (
                                <UserItem
                                    key={user.id}
                                    user={user}
                                    isSelected={selectedUser?.id === user.id}
                                    onSelect={() => setSelectedUser(user)}
                                />
                            ))
                        ) : (
                            <div className="text-xs text-gray-400">No recent users found</div>
                        )}
                    </div>

                    {/* Selected User Preview */}
                    {selectedUser && (
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-2 border-blue-400 dark:border-blue-600">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                    Commenting as: {selectedUser.displayName || selectedUser.username || `User #${selectedUser.id}`}
                                </span>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="text-xs text-red-500 hover:text-red-700"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Comment Content */}
            {selectedTarget && selectedUser && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Comment Content
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useRandomContent}
                                onChange={(e) => setUseRandomContent(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                Random content
                            </span>
                        </label>
                    </div>

                    {useRandomContent ? (
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400 italic">
                            A random comment will be generated on submit
                        </div>
                    ) : (
                        <textarea
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            placeholder="Enter your comment..."
                            rows={3}
                            className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 resize-none"
                        />
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={createComment}
                        disabled={creatingComment || (!useRandomContent && !commentContent.trim())}
                        className="w-full px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                        {creatingComment ? 'Creating...' : 'Create Comment'}
                    </button>
                </div>
            )}

            {/* Created Comments */}
            {createdComments.length > 0 && (
                <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Created Comments ({createdComments.length})
                    </div>
                    <div className="space-y-2">
                        {createdComments.map(comment => (
                            <CommentCard key={comment.id} comment={comment} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
