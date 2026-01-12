import React, { useState, useEffect, useRef } from 'react';
import { apiMutate, apiGet } from '@/shared/api/apiClient';
import type { PostDTO, HandshakeDTO, UserDTO } from '@/shared/api/types';

interface CreatedHandshake extends HandshakeDTO {
    userName?: string;
    postType?: 'gift' | 'request';
    postSenderID?: number;
}

type PostTypeFilter = 'all' | 'gift' | 'request';

// Session storage key for completed posts
const COMPLETED_POSTS_KEY = 'devtools-completed-handshake-posts';

const RANDOM_TITLES = [
    'Test Post',
    'Quick Offer',
    'Need Help',
    'Sharing This',
    'Looking For',
    'Can Provide',
    'Seeking',
    'Available Now',
    'Free Stuff',
    'Request'
];

const RANDOM_BODIES = [
    'This is a test post for handshake simulation',
    'Lorem ipsum dolor sit amet',
    'Need assistance with this',
    'Happy to share this with the community',
    'Looking for someone to help'
];

export default function AddHandshakeSection() {
    // Post selection
    const [selectedPost, setSelectedPost] = useState<PostDTO | null>(null);
    const [recentPosts, setRecentPosts] = useState<PostDTO[]>([]);
    const [postSearchQuery, setPostSearchQuery] = useState('');
    const [postSearchResults, setPostSearchResults] = useState<PostDTO[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [searchingPosts, setSearchingPosts] = useState(false);
    const [postTypeFilter, setPostTypeFilter] = useState<PostTypeFilter>('all');
    const [creatingRandomPost, setCreatingRandomPost] = useState(false);

    // User selection
    const [recentUsers, setRecentUsers] = useState<UserDTO[]>([]);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userSearchResults, setUserSearchResults] = useState<UserDTO[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchingUsers, setSearchingUsers] = useState(false);

    // Handshake creation
    const [status, setStatus] = useState<'new' | 'accepted'>('new');
    const [creatingForUser, setCreatingForUser] = useState<number | null>(null);
    const [createdHandshakes, setCreatedHandshakes] = useState<
        CreatedHandshake[]
    >([]);
    const [updatingHandshake, setUpdatingHandshake] = useState<number | null>(
        null
    );
    const [autoTestFlow, setAutoTestFlow] = useState(false);

    // Track posts completed in this session
    const [completedPostIds, setCompletedPostIds] = useState<Set<number>>(
        () => {
            try {
                const saved = sessionStorage.getItem(COMPLETED_POSTS_KEY);
                return new Set(saved ? JSON.parse(saved) : []);
            }
            catch {
                return new Set();
            }
        }
    );

    // Ref for scrolling to user section
    const userSectionRef = useRef<HTMLDivElement>(null);

    // Fetch recent posts on mount and when filter changes
    useEffect(() => {
        fetchRecentPosts();
    }, [postTypeFilter]);

    useEffect(() => {
        fetchRecentUsers();
    }, []);

    // Persist completedPostIds to sessionStorage
    useEffect(() => {
        sessionStorage.setItem(
            COMPLETED_POSTS_KEY,
            JSON.stringify(Array.from(completedPostIds))
        );
    }, [completedPostIds]);

    // Scroll to user section when a post is selected
    useEffect(() => {
        if (selectedPost && userSectionRef.current) {
            setTimeout(() => {
                userSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
    }, [selectedPost]);

    const fetchRecentPosts = async () => {
        setLoadingPosts(true);
        try {
            // Use dev endpoint to get posts with handshakes included for filtering
            const posts = await apiGet<PostDTO[]>('/dev/posts');
            let filteredPosts = posts || [];

            // Filter by type client-side
            if (postTypeFilter !== 'all') {
                filteredPosts = filteredPosts.filter(
                    (p) => p.type === postTypeFilter
                );
            }

            // Filter out posts with completed handshakes (can't add more if one is completed)
            filteredPosts = filteredPosts.filter((p) => {
                const handshakes = p.handshakes || [];
                return !handshakes.some((h) => h.status === 'completed');
            });

            setRecentPosts(filteredPosts.slice(0, 10));
        }
        catch (err) {
            console.error('Failed to fetch recent posts:', err);
        }
        finally {
            setLoadingPosts(false);
        }
    };

    const createPost = async (postType: 'gift' | 'request') => {
        setCreatingRandomPost(true);
        try {
            const randomTitle =
                RANDOM_TITLES[Math.floor(Math.random() * RANDOM_TITLES.length)];
            const randomBody =
                RANDOM_BODIES[Math.floor(Math.random() * RANDOM_BODIES.length)];

            // Get a random user to create the post as
            const usersResponse = await apiGet<{ data: UserDTO[] }>('/users', {
                params: { limit: 20 }
            });
            const users = usersResponse.data || [];
            const randomUser =
                users.length > 0
                    ? users[Math.floor(Math.random() * users.length)]
                    : null;

            if (!randomUser) {
                alert('No users available to create post');
                return;
            }

            const postData = {
                title: `${randomTitle} #${Date.now().toString(36)}`,
                body: randomBody,
                type: postType,
                categoryID: 1, // Default category
                userId: randomUser.id
            };

            const post = await apiMutate<PostDTO, any>(
                '/dev/posts/as-user',
                'post',
                postData,
                { as: 'form' }
            );

            // Select the newly created post
            setSelectedPost(post);
            setCreatedHandshakes([]);

            // Refresh recent posts
            await fetchRecentPosts();
        }
        catch (err: any) {
            console.error('Failed to create random post:', err);
            alert(`Failed to create post: ${err?.message || err}`);
        }
        finally {
            setCreatingRandomPost(false);
        }
    };

    const fetchRecentUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await apiGet<{ data: UserDTO[] }>('/users', {
                params: { limit: 10 }
            });
            setRecentUsers(response.data || []);
        }
        catch (err) {
            console.error('Failed to fetch recent users:', err);
        }
        finally {
            setLoadingUsers(false);
        }
    };

    const searchPosts = async () => {
        if (!postSearchQuery.trim()) return;
        setSearchingPosts(true);
        try {
            const results = await apiGet<PostDTO[]>('/posts/search', {
                params: { q: postSearchQuery, limit: 5 }
            });
            setPostSearchResults(results || []);
        }
        catch (err) {
            console.error('Failed to search posts:', err);
        }
        finally {
            setSearchingPosts(false);
        }
    };

    const searchUsers = async () => {
        if (!userSearchQuery.trim()) return;
        setSearchingUsers(true);
        try {
            const results = await apiGet<UserDTO[]>('/users/search', {
                params: { q: userSearchQuery, limit: 5 }
            });
            setUserSearchResults(results || []);
        }
        catch (err) {
            console.error('Failed to search users:', err);
        }
        finally {
            setSearchingUsers(false);
        }
    };

    const selectRandomPost = async () => {
        setLoadingPosts(true);
        try {
            const posts = await apiGet<PostDTO[]>('/dev/posts');
            let filteredPosts = posts || [];

            // Filter by type client-side
            if (postTypeFilter !== 'all') {
                filteredPosts = filteredPosts.filter(
                    (p) => p.type === postTypeFilter
                );
            }

            // Filter out posts with completed handshakes
            filteredPosts = filteredPosts.filter((p) => {
                const handshakes = p.handshakes || [];
                return !handshakes.some((h) => h.status === 'completed');
            });

            if (filteredPosts.length > 0) {
                const randomPost =
                    filteredPosts[
                        Math.floor(Math.random() * filteredPosts.length)
                    ];
                setSelectedPost(randomPost);
                setCreatedHandshakes([]);
            }
        }
        catch (err) {
            console.error('Failed to fetch random post:', err);
        }
        finally {
            setLoadingPosts(false);
        }
    };

    const refreshPostData = async (postId: number) => {
        try {
            const freshPost = await apiGet<PostDTO>(`/posts/${postId}`);
            setSelectedPost(freshPost);
            return freshPost;
        }
        catch (err) {
            console.error('Failed to refresh post data:', err);
            return null;
        }
    };

    const markPostAsCompleted = (postId: number) => {
        setCompletedPostIds((prev) => {
            const newSet = new Set(prev);
            newSet.add(postId);
            return newSet;
        });
        // Refresh the posts list to filter out completed posts
        fetchRecentPosts();
    };

    const createHandshakeForUser = async (user: UserDTO) => {
        if (!selectedPost) return;

        if (user.id === selectedPost.senderID) {
            alert('Sender cannot be the same as the post owner');
            return;
        }

        setCreatingForUser(user.id);

        try {
            // Check if user already has a handshake
            const freshPost = await refreshPostData(selectedPost.id);
            if (freshPost) {
                const existingHandshake = (freshPost.handshakes || []).find(
                    (h) => h.senderID === user.id
                );
                if (existingHandshake) {
                    alert(
                        `User #${user.id} already has a ${existingHandshake.status} handshake on this post`
                    );
                    setCreatingForUser(null);
                    return;
                }
            }

            // Create handshake using dev endpoint
            const handshake = await apiMutate<HandshakeDTO, any>(
                '/dev/handshakes/create',
                'post',
                {
                    postID: selectedPost.id,
                    senderID: user.id,
                    receiverID: selectedPost.senderID,
                    status: autoTestFlow ? 'new' : status
                }
            );

            const postCreatorId = selectedPost.senderID;
            const handshakeSenderId = user.id;
            const isGift = selectedPost.type === 'gift';

            // If auto-test flow is enabled, run through the complete flow
            if (autoTestFlow) {
                // Step 1: Accept (by post creator)
                await apiMutate(
                    `/dev/handshakes/${handshake.id}/update`,
                    'post',
                    {
                        status: 'accepted',
                        userId: postCreatorId
                    }
                );

                // Step 2: Complete (by receiver - for gift it's hs sender, for request it's post creator)
                const receiverId = isGift ? handshakeSenderId : postCreatorId;
                await apiMutate(
                    `/dev/handshakes/${handshake.id}/update`,
                    'post',
                    {
                        status: 'completed',
                        userId: receiverId
                    }
                );

                // Update handshake status for display
                handshake.status = 'completed';

                // Mark post as completed
                markPostAsCompleted(selectedPost.id);
            }

            // Add to created handshakes list with post info
            setCreatedHandshakes((prev) => [
                ...prev,
                {
                    ...handshake,
                    userName:
                        user.displayName || user.username || `User #${user.id}`,
                    postType: selectedPost.type as 'gift' | 'request',
                    postSenderID: selectedPost.senderID
                }
            ]);

            // Refresh post data
            await refreshPostData(selectedPost.id);
        }
        catch (err: any) {
            const errorMessage =
                err?.response?.data?.error || err?.message || err;
            alert(`Failed to create handshake: ${errorMessage}`);
        }
        finally {
            setCreatingForUser(null);
        }
    };

    const updateHandshakeStatus = async (
        handshakeId: number,
        newStatus: 'accepted' | 'completed',
        asUserId?: number
    ) => {
        setUpdatingHandshake(handshakeId);
        try {
            // Use dev endpoint for impersonation
            if (asUserId) {
                await apiMutate(
                    `/dev/handshakes/${handshakeId}/update`,
                    'post',
                    {
                        status: newStatus,
                        userId: asUserId
                    }
                );
            }
            else {
                await apiMutate(`/handshakes/${handshakeId}`, 'patch', {
                    status: newStatus
                });
            }

            // Update local state
            setCreatedHandshakes((prev) =>
                prev.map((hs) =>
                    hs.id === handshakeId ? { ...hs, status: newStatus } : hs
                )
            );

            // If completed, mark the post as completed
            if (newStatus === 'completed' && selectedPost) {
                markPostAsCompleted(selectedPost.id);
            }

            // Refresh post data
            if (selectedPost) {
                await refreshPostData(selectedPost.id);
            }
        }
        catch (err: any) {
            const errorMessage =
                err?.response?.data?.error || err?.message || err;
            alert(`Failed to update handshake: ${errorMessage}`);
        }
        finally {
            setUpdatingHandshake(null);
        }
    };

    const deleteHandshake = async (handshakeId: number) => {
        if (!confirm('Delete this handshake?')) return;

        setUpdatingHandshake(handshakeId);
        try {
            await apiMutate(`/handshakes/${handshakeId}`, 'delete');

            // Remove from local state
            setCreatedHandshakes((prev) =>
                prev.filter((hs) => hs.id !== handshakeId)
            );

            // Refresh post data
            if (selectedPost) {
                await refreshPostData(selectedPost.id);
            }
        }
        catch (err: any) {
            const errorMessage =
                err?.response?.data?.error || err?.message || err;
            alert(`Failed to delete handshake: ${errorMessage}`);
        }
        finally {
            setUpdatingHandshake(null);
        }
    };

    const PostItem = ({
        post,
        isSelected,
        onSelect
    }: {
        post: PostDTO;
        isSelected: boolean;
        onSelect: () => void;
    }) => {
        const isCompleted = completedPostIds.has(post.id);
        return (
            <button
                onClick={onSelect}
                className={`w-full text-left p-2 rounded-lg text-xs transition-colors relative ${
                    isCompleted
                        ? 'bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 opacity-60'
                        : isSelected
                            ? 'bg-purple-100 dark:bg-purple-900 border-2 border-purple-500'
                            : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
                {isCompleted && (
                    <div className='absolute top-1 right-1 px-1.5 py-0.5 bg-green-500 text-white rounded text-[10px] font-medium'>
                        ✓ Done
                    </div>
                )}
                <div className='font-medium text-gray-800 dark:text-gray-200 truncate pr-12'>
                    {post.title}
                </div>
                <div className='text-gray-500 dark:text-gray-400 flex gap-2 mt-0.5'>
                    <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${post.type === 'gift' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'}`}
                    >
                        {post.type}
                    </span>
                    <span>#{post.id}</span>
                    <span>by User #{post.senderID}</span>
                </div>
            </button>
        );
    };

    const getHandshakeForUser = (userId: number): HandshakeDTO | undefined => {
        return (selectedPost?.handshakes || []).find(
            (h) => h.senderID === userId
        );
    };

    const getUserDisabledReason = (userId: number): string | undefined => {
        if (selectedPost?.senderID === userId) return 'post owner';
        const existingHandshake = getHandshakeForUser(userId);
        if (existingHandshake) return `has ${existingHandshake.status} hs`;
        return undefined;
    };

    const UserItem = ({
        user,
        onAdd,
        disabled,
        disabledReason,
        isCreating
    }: {
        user: UserDTO;
        onAdd: () => void;
        disabled?: boolean;
        disabledReason?: string;
        isCreating: boolean;
    }) => (
        <div
            className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${
                disabled
                    ? 'opacity-50 bg-gray-100 dark:bg-gray-800'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }`}
        >
            <div className='flex-1 min-w-0'>
                <div className='font-medium text-gray-800 dark:text-gray-200 truncate'>
                    {user.displayName || user.username || `User #${user.id}`}
                    {disabledReason && (
                        <span className='ml-2 text-red-500 text-[10px]'>
                            ({disabledReason})
                        </span>
                    )}
                </div>
                <div className='text-gray-500 dark:text-gray-400 text-[10px]'>
                    #{user.id} {user.username && `@${user.username}`}
                </div>
            </div>
            <button
                onClick={onAdd}
                disabled={disabled || isCreating || !selectedPost}
                className='flex-shrink-0 w-7 h-7 flex items-center justify-center bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:dark:bg-gray-600 text-white rounded-full text-lg font-bold disabled:cursor-not-allowed transition-colors'
                title={
                    disabled ? disabledReason : 'Add handshake for this user'
                }
            >
                {isCreating ? '...' : '+'}
            </button>
        </div>
    );

    const HandshakeCard = ({ hs }: { hs: CreatedHandshake }) => {
        const isUpdating = updatingHandshake === hs.id;

        // Determine roles based on post type
        // Post creator (User A) = hs.postSenderID
        // Handshake sender (User B) = hs.senderID
        const postCreatorId = hs.postSenderID;
        const handshakeSenderId = hs.senderID;

        // For gifts: User A (post creator) gives, User B (hs sender) receives
        // For requests: User B (hs sender) gives, User A (post creator) receives
        const isGift = hs.postType === 'gift';

        // Actions:
        // - Accept: Always by post creator (User A), when status is 'new'
        // - Complete: By item receiver, when status is 'accepted'
        const canUserAAccept = hs.status === 'new';
        const canReceiverComplete = hs.status === 'accepted';

        const StatusBadge = () => (
            <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    hs.status === 'new'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                        : hs.status === 'accepted'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : hs.status === 'completed'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                : hs.status === 'cancelled'
                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                }`}
            >
                {hs.status}
            </span>
        );

        const UserPanel = ({
            userId,
            label,
            role,
            roleColor,
            actions
        }: {
            userId?: number;
            label: string;
            role: string;
            roleColor: string;
            actions: React.ReactNode;
        }) => (
            <div className={`flex-1 p-2 rounded-lg border ${roleColor}`}>
                <div className='flex items-center justify-between mb-1.5'>
                    <div className='text-[10px] text-gray-500 dark:text-gray-400'>
                        {label}
                    </div>
                    <div className='text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'>
                        {role}
                    </div>
                </div>
                <div className='font-medium text-gray-800 dark:text-gray-200 text-xs mb-2'>
                    User #{userId}
                </div>
                <div className='flex flex-wrap gap-1'>{actions}</div>
            </div>
        );

        return (
            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs overflow-hidden'>
                {/* Header */}
                <div className='flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700'>
                    <div className='flex items-center gap-2'>
                        <span className='font-semibold text-gray-800 dark:text-gray-200'>
                            HS #{hs.id}
                        </span>
                        <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                                isGift
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            }`}
                        >
                            {isGift ? 'Gift' : 'Request'}
                        </span>
                        <StatusBadge />
                    </div>
                    {hs.status !== 'completed' && hs.status !== 'cancelled' && (
                        <div className='flex gap-1'>
                            <button
                                onClick={() =>
                                    updateHandshakeStatus(
                                        hs.id,
                                        'cancelled' as any,
                                        handshakeSenderId
                                    )
                                }
                                disabled={isUpdating}
                                className='px-2 py-0.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded text-[10px]'
                                title={`Cancel as User #${handshakeSenderId}`}
                            >
                                {isUpdating ? '...' : 'Cancel'}
                            </button>
                            <button
                                onClick={() => deleteHandshake(hs.id)}
                                disabled={isUpdating}
                                className='px-2 py-0.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded text-[10px]'
                                title='Delete handshake'
                            >
                                {isUpdating ? '...' : 'Del'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Two-sided panels */}
                <div className='flex gap-2 p-2'>
                    {/* Post Creator (User A) Panel */}
                    <UserPanel
                        userId={postCreatorId}
                        label='Post Creator'
                        role={isGift ? 'Gifter' : 'Receiver'}
                        roleColor={
                            isGift
                                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                                : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                        }
                        actions={
                            <>
                                {canUserAAccept && (
                                    <button
                                        onClick={() =>
                                            updateHandshakeStatus(
                                                hs.id,
                                                'accepted',
                                                postCreatorId
                                            )
                                        }
                                        disabled={isUpdating}
                                        className='px-2 py-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded text-[10px]'
                                        title={`Accept as User #${postCreatorId}`}
                                    >
                                        {isUpdating ? '...' : 'Accept'}
                                    </button>
                                )}
                                {!isGift && canReceiverComplete && (
                                    <button
                                        onClick={() =>
                                            updateHandshakeStatus(
                                                hs.id,
                                                'completed',
                                                postCreatorId
                                            )
                                        }
                                        disabled={isUpdating}
                                        className='px-2 py-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded text-[10px]'
                                        title={`Complete as User #${postCreatorId} (receiver)`}
                                    >
                                        {isUpdating
                                            ? '...'
                                            : 'Complete + Kudos'}
                                    </button>
                                )}
                                {hs.status === 'new' && (
                                    <span className='text-[10px] text-gray-400 italic'>
                                        waiting to accept...
                                    </span>
                                )}
                                {hs.status === 'accepted' && isGift && (
                                    <span className='text-[10px] text-gray-400 italic'>
                                        waiting for receiver...
                                    </span>
                                )}
                                {hs.status === 'completed' && (
                                    <span className='text-[10px] text-green-600 dark:text-green-400'>
                                        Done!
                                    </span>
                                )}
                            </>
                        }
                    />

                    {/* Handshake Sender (User B) Panel */}
                    <UserPanel
                        userId={handshakeSenderId}
                        label={`HS Sender${hs.userName ? ` (${hs.userName})` : ''}`}
                        role={isGift ? 'Receiver' : 'Gifter'}
                        roleColor={
                            isGift
                                ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                        }
                        actions={
                            <>
                                {isGift && canReceiverComplete && (
                                    <button
                                        onClick={() =>
                                            updateHandshakeStatus(
                                                hs.id,
                                                'completed',
                                                handshakeSenderId
                                            )
                                        }
                                        disabled={isUpdating}
                                        className='px-2 py-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded text-[10px]'
                                        title={`Complete as User #${handshakeSenderId} (receiver)`}
                                    >
                                        {isUpdating
                                            ? '...'
                                            : 'Complete + Kudos'}
                                    </button>
                                )}
                                {hs.status === 'new' && (
                                    <span className='text-[10px] text-gray-400 italic'>
                                        waiting for acceptance...
                                    </span>
                                )}
                                {hs.status === 'accepted' && !isGift && (
                                    <span className='text-[10px] text-gray-400 italic'>
                                        waiting for receiver...
                                    </span>
                                )}
                                {hs.status === 'completed' && (
                                    <span className='text-[10px] text-green-600 dark:text-green-400'>
                                        Done!
                                    </span>
                                )}
                            </>
                        }
                    />
                </div>

                {/* Flow explanation */}
                <div className='px-3 py-1.5 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400'>
                    {isGift ? (
                        <>
                            User #{postCreatorId} offers → User #
                            {handshakeSenderId} requests → Accept → User #
                            {handshakeSenderId} receives & sends kudos
                        </>
                    ) : (
                        <>
                            User #{postCreatorId} requests → User #
                            {handshakeSenderId} offers help → Accept → User #
                            {postCreatorId} receives & sends kudos
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className='space-y-4'>
            <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                Add Handshakes to Post
            </h3>

            {/* Post Selection */}
            <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                    <label className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                        Select Post
                    </label>
                    <div className='flex gap-1'>
                        <button
                            onClick={() => createPost('gift')}
                            disabled={creatingRandomPost}
                            className='px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50'
                            title='Create a new gift post'
                        >
                            {creatingRandomPost ? '...' : '+ Gift'}
                        </button>
                        <button
                            onClick={() => createPost('request')}
                            disabled={creatingRandomPost}
                            className='px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50'
                            title='Create a new request post'
                        >
                            {creatingRandomPost ? '...' : '+ Req'}
                        </button>
                        <button
                            onClick={selectRandomPost}
                            disabled={loadingPosts}
                            className='px-2 py-1 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded disabled:opacity-50'
                        >
                            {loadingPosts ? '...' : 'Rnd'}
                        </button>
                    </div>
                </div>

                {/* Post Type Filter */}
                <div className='flex gap-1 items-center flex-wrap'>
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
                    {completedPostIds.size > 0 && (
                        <>
                            <span className='text-gray-400 dark:text-gray-500 mx-1'>
                                |
                            </span>
                            <span className='text-[10px] text-green-600 dark:text-green-400 font-medium'>
                                {completedPostIds.size} done
                            </span>
                            <button
                                onClick={() => {
                                    setCompletedPostIds(new Set());
                                    fetchRecentPosts();
                                }}
                                className='px-1.5 py-0.5 text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 rounded'
                                title='Reset completed posts tracking'
                            >
                                Reset
                            </button>
                        </>
                    )}
                </div>

                {/* Post Search */}
                <div className='flex gap-2'>
                    <input
                        type='text'
                        value={postSearchQuery}
                        onChange={(e) => setPostSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchPosts()}
                        placeholder='Search posts...'
                        className='flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800'
                    />
                    <button
                        onClick={searchPosts}
                        disabled={searchingPosts || !postSearchQuery.trim()}
                        className='px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded disabled:opacity-50'
                    >
                        {searchingPosts ? '...' : 'Search'}
                    </button>
                </div>

                {/* Post Search Results */}
                {postSearchResults.length > 0 && (
                    <div className='space-y-1'>
                        <div className='text-[10px] text-gray-500 uppercase'>
                            Search Results
                        </div>
                        {postSearchResults.map((post) => (
                            <PostItem
                                key={post.id}
                                post={post}
                                isSelected={selectedPost?.id === post.id}
                                onSelect={() => {
                                    setSelectedPost(post);
                                    setPostSearchResults([]);
                                    setPostSearchQuery('');
                                    setCreatedHandshakes([]);
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Recent Posts */}
                <div className='space-y-1'>
                    <div className='text-[10px] text-gray-500 uppercase'>
                        Recent Posts
                    </div>
                    {loadingPosts ? (
                        <div className='text-xs text-gray-400'>Loading...</div>
                    ) : recentPosts.length > 0 ? (
                        recentPosts.map((post) => (
                            <PostItem
                                key={post.id}
                                post={post}
                                isSelected={selectedPost?.id === post.id}
                                onSelect={() => {
                                    setSelectedPost(post);
                                    setCreatedHandshakes([]);
                                }}
                            />
                        ))
                    ) : (
                        <div className='text-xs text-gray-400'>
                            No recent posts found
                        </div>
                    )}
                </div>

                {/* Selected Post Preview */}
                {selectedPost && (
                    <div className='p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg border-2 border-purple-400 dark:border-purple-600 shadow-md'>
                        <div className='flex items-center justify-between'>
                            <span className='text-xs font-medium text-purple-700 dark:text-purple-300'>
                                Selected:
                            </span>
                            <button
                                onClick={() => {
                                    setSelectedPost(null);
                                    setCreatedHandshakes([]);
                                }}
                                className='text-xs text-red-500 hover:text-red-700'
                            >
                                Clear
                            </button>
                        </div>
                        <div className='text-xs text-gray-700 dark:text-gray-300 mt-1'>
                            #{selectedPost.id} - {selectedPost.title} (
                            {selectedPost.type})
                        </div>

                        {/* Scroll indicator */}
                        <div className='mt-2 pt-2 border-t border-purple-200 dark:border-purple-700 flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400'>
                            <span className='text-xs font-medium'>
                                Continue below to add handshakes
                            </span>
                            <span className='animate-bounce text-lg'>↓</span>
                        </div>

                        {/* Existing Handshakes on this post */}
                        {selectedPost.handshakes &&
                            selectedPost.handshakes.length > 0 && (
                            <div className='mt-2 pt-2 border-t border-purple-200 dark:border-purple-700'>
                                <div className='text-[10px] text-purple-600 dark:text-purple-400 font-medium mb-1'>
                                        Existing Handshakes (
                                    {selectedPost.handshakes.length}):
                                </div>
                                <div className='space-y-1'>
                                    {selectedPost.handshakes.map((hs) => (
                                        <div
                                            key={hs.id}
                                            className='flex items-center gap-2 text-[10px] bg-white/50 dark:bg-black/20 px-2 py-1 rounded'
                                        >
                                            <span
                                                className={`px-1.5 py-0.5 rounded ${
                                                    hs.status === 'new'
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                                                        : hs.status ===
                                                                'accepted'
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                                            : hs.status ===
                                                                  'completed'
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                                                }`}
                                            >
                                                {hs.status}
                                            </span>
                                            <span className='text-gray-600 dark:text-gray-400'>
                                                    User #{hs.senderID}
                                            </span>
                                            <span className='text-gray-400 dark:text-gray-500'>
                                                    (HS #{hs.id})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Initial Status */}
            {selectedPost && (
                <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                        <label className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                            Initial Status
                        </label>
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <input
                                type='checkbox'
                                checked={autoTestFlow}
                                onChange={(e) =>
                                    setAutoTestFlow(e.target.checked)
                                }
                                className='w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500'
                            />
                            <span className='text-xs text-purple-600 dark:text-purple-400 font-medium'>
                                Auto-complete flow
                            </span>
                        </label>
                    </div>
                    {autoTestFlow ? (
                        <div className='p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-xs text-purple-700 dark:text-purple-300'>
                            Will run full flow: new → accept → complete (with
                            kudos)
                        </div>
                    ) : (
                        <div className='flex gap-2'>
                            <button
                                onClick={() => setStatus('new')}
                                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                    status === 'new'
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                New (Pending)
                            </button>
                            <button
                                onClick={() => setStatus('accepted')}
                                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                    status === 'accepted'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                Accepted
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* User Selection - Click + to add handshake */}
            {selectedPost && (
                <div ref={userSectionRef} className='space-y-2 scroll-mt-4'>
                    <label className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                        Click + to create handshake for user
                    </label>

                    {/* User Search */}
                    <div className='flex gap-2'>
                        <input
                            type='text'
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && searchUsers()
                            }
                            placeholder='Search users...'
                            className='flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800'
                        />
                        <button
                            onClick={searchUsers}
                            disabled={searchingUsers || !userSearchQuery.trim()}
                            className='px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded disabled:opacity-50'
                        >
                            {searchingUsers ? '...' : 'Search'}
                        </button>
                    </div>

                    {/* User Search Results */}
                    {userSearchResults.length > 0 && (
                        <div className='space-y-1'>
                            <div className='text-[10px] text-gray-500 uppercase'>
                                Search Results
                            </div>
                            {userSearchResults.map((user) => {
                                const disabledReason = getUserDisabledReason(
                                    user.id
                                );
                                return (
                                    <UserItem
                                        key={user.id}
                                        user={user}
                                        disabled={!!disabledReason}
                                        disabledReason={disabledReason}
                                        isCreating={creatingForUser === user.id}
                                        onAdd={() => {
                                            createHandshakeForUser(user);
                                            setUserSearchResults([]);
                                            setUserSearchQuery('');
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {/* Recent Users */}
                    <div className='space-y-1'>
                        <div className='text-[10px] text-gray-500 uppercase'>
                            Recent Users
                        </div>
                        {loadingUsers ? (
                            <div className='text-xs text-gray-400'>
                                Loading...
                            </div>
                        ) : recentUsers.length > 0 ? (
                            recentUsers.map((user) => {
                                const disabledReason = getUserDisabledReason(
                                    user.id
                                );
                                return (
                                    <UserItem
                                        key={user.id}
                                        user={user}
                                        disabled={!!disabledReason}
                                        disabledReason={disabledReason}
                                        isCreating={creatingForUser === user.id}
                                        onAdd={() =>
                                            createHandshakeForUser(user)
                                        }
                                    />
                                );
                            })
                        ) : (
                            <div className='text-xs text-gray-400'>
                                No recent users found
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Created Handshakes with action buttons */}
            {createdHandshakes.length > 0 && (
                <div className='space-y-2'>
                    <div className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                        Created Handshakes ({createdHandshakes.length})
                    </div>
                    <div className='space-y-2'>
                        {createdHandshakes.map((hs) => (
                            <HandshakeCard key={hs.id} hs={hs} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
