import React, { useState } from 'react';
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/solid';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { PencilSquareIcon } from '@heroicons/react/24/solid';

import MapDisplay from '@/components/Map';
import MessageList from '@/components/messages/MessageList';
import ChatModal from '@/components/messages/ChatModal';
import ImageCarousel from '@/components/Carousel';
import Handshakes from '@/components/handshakes/Handshakes';
import UserCard from '@/components/users/UserCard';
import TagInput from '@/components/TagInput';
import { useAuth } from '@/hooks/useAuth';
import Alert from '@/components/common/Alert';
import { useUpdatePost, useLikePost, useReportPost, useCreateHandshake } from '@/shared/api/mutations/posts';

import type {
    ChannelDTO,
    CreateHandshakeDTO,
    PostDTO,
    LocationDTO,
    UpdatePostDTO
} from '@/shared/api/types';
import Pill from '../common/Pill';
import Button from '../common/Button';

interface Props {
    id?: string;
    loading?: boolean;
    error?: string;
    showHandshakeShortcut?: boolean;
    setPostDetails?: (post: PostDTO | ((prev: PostDTO) => PostDTO)) => void;
    setLiked?: (liked: boolean | null) => void;
    post?: PostDTO;
    liked?: boolean;
    fetchPostDetails?: (id: number) => void;
}

function EditPostButton({ onClick }: { onClick: () => void }) {
    return (
        <Button
            onClick={onClick}
            className='inline-flex items-center gap-1 text-sm font-semibold shadow'
        >
            <PencilSquareIcon className='h-5 w-5 shrink-0' aria-hidden='true' />
            Edit
        </Button>
    );
}

export default function PostDetails(props: Props) {
    const {
        loading,
        error,
        setPostDetails,
        post: postDetails,
        setLiked,
        liked,
        fetchPostDetails
    } = props;

    const { user, token } = useAuth();

    const updatePostMut = useUpdatePost();
    const likeMut = useLikePost();
    const reportMut = useReportPost();
    const createHsMut = useCreateHandshake();

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: '',
        body: '',
        tags: [] as string[],
        location: null as LocationDTO | null
    });
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [showAllHandshakes, setShowAllHandshakes] = useState(false);
    const [creatingHandshake, setCreatingHandshake] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [pendingRecipientID, setPendingRecipientID] = useState<number | null>(
        null
    );
    const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(
        null
    );

    // Add this helper function at the top of your PostDetails component,
    // right after the imports and before the main component function:

    const sortHandshakesWithUserFirst = (
        handshakes: any[],
        userId?: number
    ) => {
        if (!userId || !handshakes?.length) return handshakes || [];

        return [...handshakes].sort((a, b) => {
            // Check if handshake belongs to current user (as sender or receiver)
            const aIsUser =
                a.senderID === userId ||
                a.receiverID === userId ||
                a.recipientID === userId;
            const bIsUser =
                b.senderID === userId ||
                b.receiverID === userId ||
                b.recipientID === userId;

            // User's handshakes first
            if (aIsUser && !bIsUser) return -1;
            if (!aIsUser && bIsUser) return 1;

            // If both or neither are user's, sort by creation date (newest first)
            return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
        });
    };

    const updateStatus = async (newStatus: string) => {
        if (!postDetails) return;
        try {
            const updated = await updatePostMut.mutateAsync({ id: postDetails.id, data: { status: newStatus } });
            setPostDetails({ ...postDetails, status: updated.status });
        }
        catch (err) {
            console.error('Failed to update post status:', err);
        }
    };

    const handleClosePost = () => updateStatus('closed');

    const handleLike = async () => {
        if (!postDetails || liked === true) return;
        try {
            await likeMut.mutateAsync({ id: postDetails.id, like: true });
            setLiked?.(true);
        }
        catch (err) {
            console.error('Failed to like post:', err);
        }
    };

    const handleDislike = async () => {
        if (!postDetails || liked === false) return;
        try {
            await likeMut.mutateAsync({ id: postDetails.id, like: false });
            setLiked?.(false);
        }
        catch (err) {
            console.error('Failed to dislike post:', err);
        }
    };

    const startDMChat = async (recipientId: number) => {
        if (!token) {
            console.error('No token found');
            return;
        }

        try {
            if (user && recipientId) {
                setIsChatOpen(true);
                setPendingRecipientID(recipientId);
            }
        }
        catch (error) {
            console.error('Error preparing DM chat:', error);
        }
    };

    const handleSubmitHandshake = () => {
        if (!token) {
            console.error('No token. Please register or log in.');
            return;
        }

        if (!postDetails) {
            console.error('Post details are not loaded.');
            return;
        }

        startDMChat(postDetails.sender?.id || 0);
    };

    const handleMessageSent = async () => {
        if (!token || !postDetails) {
            console.error('Missing required data to create handshake:', {
                token: !!token,
                postDetails: !!postDetails
            });
            return;
        }

        const recipientId = pendingRecipientID;
        if (!recipientId) {
            console.error('Could not find recipient ID');
            return;
        }

        console.log('Creating handshake from message sent callback with:', {
            postID: postDetails.id,
            senderID: user?.id,
            recipientId,
            type: postDetails.type
        });

        setCreatingHandshake(true);

        try {
            const handshakeData: CreateHandshakeDTO = {
                postID: postDetails.id,
                senderID: user?.id || 0,
                receiverID: recipientId.toString(),
                type: postDetails.type,
                status: 'new'
            };

            console.log('Sending handshake data:', handshakeData);
            const { data: newHandshake } = await createHsMut.mutateAsync(handshakeData);

            setPostDetails((prevDetails: PostDTO) => ({
                ...prevDetails!,
                handshakes: [...(prevDetails?.handshakes || []), newHandshake],
            }));

            alert('Handshake created successfully! You can now coordinate the details with the post owner.');
            setIsChatOpen(false);
            setPendingRecipientID(null);
            fetchPostDetails?.(postDetails.id);
        }
        catch (error) {
            console.error('Error creating handshake:', error);
        }
        finally {
            setCreatingHandshake(false);
        }
    };

    const handleChannelCreated = async (channel: ChannelDTO) => {
        if (!token || !postDetails) {
            console.error('Missing required data to create handshake:', {
                token: !!token,
                postDetails: !!postDetails
            });
            return;
        }

        const recipientId = channel.users?.find((u) => u.id !== user?.id)?.id;
        if (!recipientId) {
            console.error('Could not find recipient ID in channel users');
            return;
        }

        console.log('Creating handshake with:', {
            postID: postDetails.id,
            senderID: user?.id,
            recipientId,
            type: postDetails.type
        });

        setCreatingHandshake(true);

        try {
            const handshakeData: CreateHandshakeDTO = {
                postID: postDetails.id,
                senderID: user?.id || 0,
                receiverID: recipientId.toString(),
                type: postDetails.type,
                status: 'new'
            };

            console.log('Sending handshake data:', handshakeData);
            const { data: newHandshake } = await createHsMut.mutateAsync(handshakeData);

            setPostDetails((prevDetails: PostDTO) => ({
                ...prevDetails!,
                handshakes: [...(prevDetails?.handshakes || []), newHandshake],
            }));

            alert('Handshake created successfully! You can now coordinate the details with the post owner.');
            setPendingRecipientID(null);
            fetchPostDetails?.(postDetails.id);
        }
        catch (error) {
            console.error('Error creating handshake:', error);
        }
        finally {
            setCreatingHandshake(false);
        }
    };

    const handleMessageUpdate = (updatedMessage: any) => {
        setPostDetails((prev: PostDTO) => {
            if (!prev) return prev;

            const updatedMessages = (prev.messages || []).map((msg) =>
                msg.id === updatedMessage.id ? updatedMessage : msg
            );

            return {
                ...prev,
                messages: updatedMessages
            };
        });
    };

    const handleMessageDelete = (deletedMessageId: number) => {
        setPostDetails((prev: PostDTO) => {
            if (!prev) return prev;

            const filteredMessages = (prev.messages || []).filter(
                (msg) => msg.id !== deletedMessageId
            );

            return {
                ...prev,
                messages: filteredMessages
            };
        });
    };

    const handleHandshakeDeleted = (id: number) => {
        if (!postDetails) return;
        setPostDetails((prev: any) => ({
            ...prev!,
            handshakes: prev!.handshakes.filter(
                (h: { id: number }) => h.id !== id
            )
        }));
    };

    const handleReport = async () => {
        if (!postDetails) return;
        if (!reportReason.trim()) {
            alert('Please enter a reason for reporting.');
            return;
        }

        try {
            await reportMut.mutateAsync({ id: postDetails.id, reason: reportReason.trim() });
            alert('Post reported successfully.');
            setReportModalVisible(false);
            setReportReason('');
        }
        catch (e) {
            console.error('Failed to report:', e);
        }
    };

    const handleTagsChange = (tags: { id: string; name: string }[]) => {
        const tagNames = tags.map((t) => t.name);
        setEditData({ ...editData, tags: tagNames });
    };

    const handleLocationChange = (data: any) => {
        if (data.coordinates) {
            const locationData: LocationDTO = {
                name: data.name,
                regionID: data.placeID
            };
            setEditData({ ...editData, location: locationData });
        }
    };

    const handleStartEdit = () => {
        if (!postDetails) return;

        setEditData({
            title: postDetails.title,
            body: postDetails.body,
            tags: postDetails.tags?.map((tag) => tag.name) || [],
            location: postDetails.location || null
        });
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        if (!postDetails) return;

        try {
            const updateData: Partial<UpdatePostDTO> = {
                title: editData.title,
                body: editData.body,
                tags: editData.tags,
            };

            if (editData.location && editData.location !== postDetails.location) {
                updateData.location = editData.location;
            }

            const updated = await updatePostMut.mutateAsync({ id: postDetails.id, data: updateData });
            setPostDetails({ ...postDetails, ...updated });
            setIsEditing(false);
        }
        catch (err) {
            console.error('Failed to save changes', err);
        }
    };

    if (loading) {
        return <div className='text-center mt-20 text-lg'>Loading post...</div>;
    }

    if (error) {
        return (
            <div className='text-center mt-20 text-red-500'>
                <p>{error}</p>
                <Button
                    className='mt-4'
                    onClick={() =>
                        postDetails?.id && fetchPostDetails(postDetails.id)
                    }
                >
                    Retry
                </Button>
            </div>
        );
    }

    if (!postDetails) return null;

    return (
        <div className='max-w-4xl mx-auto p-4'>
            {/* Header / Avatar */}
            <UserCard user={postDetails.sender} large />

            {/* Post Title and Badges */}
            <div className='mb-4'>
                <div className='flex items-center gap-2'>
                    {postDetails.status === 'closed' && (
                        <Pill tone='danger'>
                            CLOSED
                        </Pill>
                    )}
                    <h1 className='text-2xl font-bold'>{postDetails.title}</h1>

                    {user?.id === postDetails.sender?.id &&
                        <EditPostButton onClick={handleStartEdit} />
                    }

                    {postDetails.status !== 'closed' &&
                        user?.id === postDetails.sender?.id && (
                        <Button
                            onClick={handleClosePost}
                            className='inline-flex items-center gap-1 text-sm font-semibold shadow'
                            variant='danger'
                        >
                            Close Post
                        </Button>
                    )}
                </div>

                {postDetails.category?.name && (
                    <p className='text-sm italic text-gray-600'>
                        Category: {postDetails.category.name}
                    </p>
                )}
                <div className='flex flex-wrap items-center gap-2 mt-2'>
                    <span
                        className={`px-2 py-1 rounded text-white text-xs ${postDetails.type === 'request' ? 'bg-blue-500' : 'bg-green-500'}`}
                    >
                        {postDetails.type}
                    </span>
                    <span className='px-2 py-1 rounded bg-gray-700 text-white text-xs'>
                        {postDetails.status}
                    </span>

                    {postDetails.tags?.map((tag, i) => (
                        <Pill key={i} name={tag.name} />
                    ))}
                </div>
            </div>

            {/* Like, Dislike, Report */}
            <div className='flex gap-4 items-center my-4 flex-wrap'>
                <Button
                    onClick={handleLike}
                    disabled={liked === true}
                    shape='pill'
                    className={`flex items-center gap-1 px-3 py-1 transition text-sm
                        ${liked === true ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                >
                    <HandThumbUpIcon className='w-4 h-4' />
                    Like
                </Button>

                <Button
                    onClick={handleDislike}
                    disabled={liked === false}
                    shape='pill'
                    variant='danger'
                    className={`flex items-center gap-1 px-3 py-1 transition text-sm
                    ${liked === false ? 'bg-gray-200 cursor-not-allowed' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                >
                    <HandThumbDownIcon className='w-4 h-4' />
                    Dislike
                </Button>

                <Button
                    onClick={() => setReportModalVisible(true)}
                    variant='warning'
                    shape='pill'
                    className='flex items-center gap-1 text-sm'
                >
                    <ExclamationTriangleIcon className='w-4 h-4' />
                    Report
                </Button>
            </div>

            {/* Body / Description - Enhanced Edit Form */}
            {isEditing ? (
                <div className='bg-white p-6 border rounded-lg mb-6 space-y-4'>
                    <h3 className='text-lg font-semibold'>Edit Post</h3>

                    {/* Title */}
                    <div>
                        <label className='block text-sm font-medium mb-1'>
                            Title
                        </label>
                        <input
                            className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            value={editData.title}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    title: e.target.value
                                })
                            }
                            placeholder='Enter post title'
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className='block text-sm font-medium mb-1'>
                            Description
                        </label>
                        <textarea
                            className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            rows={4}
                            value={editData.body}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    body: e.target.value
                                })
                            }
                            placeholder='Enter post description'
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <TagInput
                            initialTags={editData.tags}
                            onTagsChange={handleTagsChange}
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className='block text-sm font-medium mb-2'>
                            Location
                        </label>
                        <MapDisplay
                            showAddressBar
                            regionID={editData.location?.regionID}
                            coordinates={null}
                            height={300}
                            shouldGetYourLocation={false}
                            onLocationChange={handleLocationChange}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className='flex gap-3 pt-4'>
                        <Button variant='success' onClick={handleSaveEdit}>
                            Save Changes
                        </Button>
                        <Button
                            variant='secondary'
                            onClick={() => setIsEditing(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <div className='bg-gray-100 rounded p-4 mb-6 break-all'>
                    <p>{postDetails.body}</p>
                    {postDetails.rewardOffers?.[0]?.kudosFinal && (
                        <p className='mt-2 font-semibold text-blue-600'>
                            Final Kudos:{' '}
                            {postDetails.rewardOffers[0].kudosFinal}
                        </p>
                    )}
                </div>
            )}

            {/* Images */}
            <ImageCarousel images={postDetails.images || []} />

            {/* Map */}
            {postDetails.location?.regionID && (
                <div className='mb-6 flex justify-center'>
                    <MapDisplay
                        showAddressBar={false}
                        regionID={postDetails.location.regionID}
                        exactLocation={true}
                        width={500}
                        height={300}
                    />
                </div>
            )}

            {/* Comments */}
            <div className='shadow p-4 rounded mb-6'>
                <MessageList
                    title='Comments'
                    messages={postDetails.messages || []}
                    callback={(response) =>
                        setPostDetails((prev: PostDTO) =>
                            prev
                                ? {
                                    ...prev,
                                    messages: [
                                        ...(prev.messages || []),
                                        response
                                    ]
                                }
                                : prev
                        )
                    }
                    postID={postDetails?.id}
                    showSendMessage={!!user}
                    allowDelete={!!user}
                    allowEdit={!!user}
                    onMessageUpdate={handleMessageUpdate}
                    onMessageDelete={handleMessageDelete}
                />
            </div>

            {/* Handshakes */}
            <div className='shadow p-4 rounded mb-6'>
                <h2 className='text-lg font-bold mb-2'>
                    {postDetails.type === 'request'
                        ? 'Offered By'
                        : 'Requested By'}
                </h2>

                <Handshakes
                    handshakes={sortHandshakesWithUserFirst(
                        postDetails.handshakes?.map((h) => ({
                            ...h,
                            post: postDetails
                        })) || [],
                        user?.id
                    )}
                    currentUserId={user?.id}
                    showAll={showAllHandshakes}
                    onShowAll={() => setShowAllHandshakes(true)}
                    onHandshakeCreated={(newHandshake) =>
                        setPostDetails((prevDetails: PostDTO) =>
                            prevDetails
                                ? {
                                    ...prevDetails,
                                    handshakes: [
                                        ...(prevDetails.handshakes || []),
                                        newHandshake
                                    ]
                                }
                                : prevDetails
                        )
                    }
                    onHandshakeDeleted={handleHandshakeDeleted}
                    showPostDetails
                />
                {/* Create handshake button if not the sender */}
                {postDetails.status !== 'closed' &&
                    user?.id !== Number(postDetails.sender?.id) &&
                    !postDetails.handshakes?.some(
                        (h) => h.sender?.id === user?.id
                    ) && (
                    <div className='mt-4 flex justify-center'>
                        <Button
                            onClick={handleSubmitHandshake}
                            disabled={creatingHandshake}
                        >
                            {creatingHandshake
                                ? 'Creating...'
                                : postDetails.type === 'gift'
                                    ? 'Request This'
                                    : 'Gift This'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Chat Modal */}
            {isChatOpen && (
                <ChatModal
                    isChatOpen={isChatOpen}
                    setIsChatOpen={setIsChatOpen}
                    recipientID={pendingRecipientID || 0}
                    selectedChannel={selectedChannel}
                    onChannelCreated={handleChannelCreated}
                    initialMessage="Hello! I've created a handshake for your post. Let's coordinate the details."
                    onMessageSent={handleMessageSent}
                />
            )}

            {/* Report Modal */}
            {reportModalVisible && (
                <div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center'>
                    <div className='bg-white rounded-lg p-6 w-full max-w-md shadow-xl'>
                        <h2 className='text-xl font-bold mb-2'>Report Post</h2>
                        <p className='text-sm text-gray-600 mb-4'>
                            Why are you reporting this post?
                        </p>
                        <textarea
                            className='w-full border border-gray-300 rounded p-2 mb-4'
                            rows={4}
                            placeholder='Enter reason...'
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                        />
                        <div className='flex justify-end gap-2'>
                            <Button
                                onClick={() => setReportModalVisible(false)}
                                variant='secondary'
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleReport} variant='danger'>
                                Submit
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {modalVisible && selectedImage && (
                <div className='fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center'>
                    <div className='relative'>
                        <img
                            src={selectedImage}
                            alt='Preview'
                            className='max-w-full max-h-[90vh] rounded shadow-lg'
                        />
                        <Button
                            onClick={() => setModalVisible(false)}
                            className='absolute top-2 right-2 text-white bg-black bg-opacity-50 px-3 py-1 rounded hover:bg-opacity-75'
                        >
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
