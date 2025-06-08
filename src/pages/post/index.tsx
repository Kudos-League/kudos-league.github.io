import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from 'redux_store/hooks';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
    HandThumbUpIcon,
    HandThumbDownIcon
} from '@heroicons/react/24/solid';

import {
    getPostDetails,
    createHandshake,
    likePost,
    reportPost,
    getUserKudos
} from 'shared/api/actions';
import { useAuth } from '@/hooks/useAuth';
import MapDisplay from '@/components/Map';
import MessageList from '@/components/messages/MessageList';
import ChatModal from '@/components/messages/ChatModal';
import {
    ChannelDTO,
    CreateHandshakeDTO,
    Post as PostType
} from 'shared/api/types';
import ImageCarousel from '@/components/Carousel';
import Handshakes from '@/components/posts/Handshakes';
import UserCard from '@/components/UserCard';

const Post = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const token = useAppSelector((state) => state.auth.token);

    const [postDetails, setPostDetails] = useState<PostType | null>(null);
    const [kudos, setKudos] = React.useState<number>(user?.kudos || 0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [liked, setLiked] = useState<boolean | null>(null);

    const [showAllHandshakes, setShowAllHandshakes] = useState(false);
    const [creatingHandshake, setCreatingHandshake] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [pendingRecipientID, setPendingRecipientID] = useState<number | null>(
        null
    );
    const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(
        null
    );

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportReason, setReportReason] = useState('');
    
    React.useEffect(() => {
        const fetchKudos = async () => {
            if (!postDetails?.sender?.id) {
                return;
            }

            try {
                const totalKudos = await getUserKudos(postDetails.sender.id, token);
                setKudos(totalKudos);
            }
            catch (error) {
                console.error('Failed to fetch user kudos:', error);
            }
        };
    
        fetchKudos();
    }, [postDetails?.sender?.id]);

    const handleLike = async () => {
        if (!postDetails || liked === true) return;

        try {
            await likePost(parseInt(postDetails.id), true, token);
            setLiked(true);
        // If you want to also update postDetails.likes, do it here
        }
        catch (err) {
            console.error('Failed to like post:', err);
            alert('Failed to like the post.');
        }
    };

    const handleDislike = async () => {
        if (!postDetails || liked === false) return;

        try {
            await likePost(parseInt(postDetails.id), false, token);
            setLiked(false);
        }
        catch (err) {
            console.error('Failed to dislike post:', err);
            alert('Failed to dislike the post.');
        }
    };

    const fetchPostDetails = async (postID: string) => {
        if (!token) {
            setError('No token found. Please log in.');
            setLoading(false);
            return;
        }

        try {
            const data = await getPostDetails(token, postID);
            setPostDetails(data);
            const userLike = data.likes?.[0]?.like ?? null;
            setLiked(userLike);
            setLoading(false);
        }
        catch (err) {
            console.error(err);
            setError('Failed to load post details. Please try again.');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchPostDetails(id);
    }, [id]);

    const startDMChat = async (recipientId: number) => {
        if (!token) {
            console.error('No token found');
            return;
        }

        try {
            if (user && recipientId) {
                // Don't create a DM channel yet, just open the chat modal
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

        // Don't create handshake yet, just open chat
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

        // Get the recipient ID (should be the same as pendingRecipientID)
        const recipientId = pendingRecipientID;
        if (!recipientId) {
            console.error('Could not find recipient ID');
            return;
        }

        console.log('Creating handshake from message sent callback with:', {
            postID: parseInt(postDetails.id),
            senderID: user?.id,
            recipientId,
            type: postDetails.type
        });

        setCreatingHandshake(true);

        try {
            // Create the handshake after message is sent
            const handshakeData: CreateHandshakeDTO = {
                postID: parseInt(postDetails.id),
                senderID: user?.id || 0,
                receiverID: recipientId.toString(),
                type: postDetails.type,
                status: 'new'
            };

            console.log('Sending handshake data:', handshakeData);
            const response = await createHandshake(handshakeData, token);

            // Check if response has the expected structure
            if (!response || !response.data) {
                console.error(
                    'Invalid response from createHandshake:',
                    response
                );
                throw new Error('Invalid response from server');
            }

            const newHandshake = response.data;

            console.log('Handshake created successfully:', newHandshake);

            // Update the post details with the new handshake
            setPostDetails((prevDetails) => ({
                ...prevDetails!,
                handshakes: [...(prevDetails?.handshakes || []), newHandshake]
            }));

            // Show feedback to the user
            alert(
                'Handshake created successfully! You can now coordinate the details with the post owner.'
            );

            // Close the chat after handshake is created
            setIsChatOpen(false);

            // Clear the pending recipient
            setPendingRecipientID(null);

            // Refresh the post details to show the new handshake
            fetchPostDetails(id);
        }
        catch (error) {
            console.error('Error creating handshake:', error);
            alert('Failed to create handshake. Please try again.');
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

        // Get the recipient ID from the channel users
        const recipientId = channel.users?.find((u) => u.id !== user?.id)?.id;
        if (!recipientId) {
            console.error('Could not find recipient ID in channel users');
            return;
        }

        console.log('Creating handshake with:', {
            postID: parseInt(postDetails.id),
            senderID: user?.id,
            recipientId,
            type: postDetails.type
        });

        setCreatingHandshake(true);

        try {
            // Now create the handshake after successful message and channel creation
            const handshakeData: CreateHandshakeDTO = {
                postID: parseInt(postDetails.id),
                senderID: user?.id || 0,
                receiverID: recipientId.toString(),
                type: postDetails.type,
                status: 'new'
            };

            console.log('Sending handshake data:', handshakeData);
            const response = await createHandshake(handshakeData, token);

            // Check if response has the expected structure
            if (!response || !response.data) {
                console.error(
                    'Invalid response from createHandshake:',
                    response
                );
                throw new Error('Invalid response from server');
            }

            const newHandshake = response.data;

            console.log('Handshake created successfully:', newHandshake);

            // Update the post details with the new handshake
            setPostDetails((prevDetails) => ({
                ...prevDetails!,
                handshakes: [...(prevDetails?.handshakes || []), newHandshake]
            }));

            // Show feedback to the user
            alert(
                'Handshake created successfully! You can now coordinate the details with the post owner.'
            );

            // Clear the pending recipient
            setPendingRecipientID(null);

            // Refresh the post details to show the new handshake
            fetchPostDetails(id);
        }
        catch (error) {
            console.error('Error creating handshake:', error);
            alert('Failed to create handshake. Please try again.');
        }
        finally {
            setCreatingHandshake(false);
        }
    };

    const handleReport = async () => {
        if (!token || !postDetails) return;

        if (!reportReason.trim()) {
            alert('Please enter a reason for reporting.');
            return;
        }

        try {
            await reportPost(
                parseInt(postDetails.id),
                reportReason.trim(),
                token
            );
            alert('Post reported successfully.');
            setReportModalVisible(false);
            setReportReason('');
        }
        catch (e) {
            console.error('Failed to report:', e);
            alert('Failed to submit report. Try again later.');
        }
    };

    if (loading)
        return <div className='text-center mt-20 text-lg'>Loading post...</div>;
    if (error)
        return (
            <div className='text-center mt-20 text-red-500'>
                <p>{error}</p>
                <button
                    className='bg-blue-500 text-white px-4 py-2 rounded mt-4'
                    onClick={() => id && fetchPostDetails(id)}
                >
                    Retry
                </button>
            </div>
        );

    if (!postDetails) return null;

    return (
        <div className='max-w-4xl mx-auto p-4'>
            {/* Header / Avatar */}
            <UserCard
                userID={postDetails.sender?.id}
                avatar={postDetails.sender?.avatar}
                username={postDetails.sender?.username}
                kudos={kudos}
                large
            />

            {/* Post Title and Badges */}
            <div className='mb-4'>
                <h1 className='text-2xl font-bold'>{postDetails.title}</h1>
                {postDetails.category?.name && (
                    <p className='text-sm italic text-gray-600'>
                        Category: {postDetails.category.name}
                    </p>
                )}
                <div className='flex gap-2 mt-2'>
                    <span
                        className={`px-2 py-1 rounded text-white text-xs ${postDetails.type === 'request' ? 'bg-blue-500' : 'bg-green-500'}`}
                    >
                        {postDetails.type}
                    </span>
                    <span className='px-2 py-1 rounded bg-gray-700 text-white text-xs'>
                        {postDetails.status}
                    </span>
                </div>
            </div>

            {/* Like, Dislike, Report */}
            <div className='flex gap-4 items-center my-4 flex-wrap'>
                <button
                    onClick={handleLike}
                    disabled={liked === true}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full border transition text-sm
                        ${liked === true ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300'}`}
                >
                    <HandThumbUpIcon className="w-4 h-4" />
                    Like
                </button>

                <button
                    onClick={handleDislike}
                    disabled={liked === false}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full border transition text-sm
                    ${liked === false ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300'}`}
                >
                    <HandThumbDownIcon className="w-4 h-4" />
                    Dislike
                </button>

                <button
                    onClick={() => setReportModalVisible(true)}
                    className='flex items-center gap-1 px-3 py-1 rounded-full border transition text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300'
                >
                    <ExclamationTriangleIcon className='w-4 h-4' />
                    Report
                </button>
            </div>

            {/* Body / Description */}
            <div className='bg-gray-100 rounded p-4 mb-6'>
                <p>{postDetails.body}</p>
                {postDetails.rewardOffers?.[0]?.kudosFinal && (
                    <p className='mt-2 font-semibold text-blue-600'>
                        Final Kudos: {postDetails.rewardOffers[0].kudosFinal}
                    </p>
                )}
            </div>

            {/* Images */}
            <ImageCarousel images={postDetails.images || []} />

            {/* Map */}
            {postDetails.location?.regionID && (
                <div className='mb-6'>
                    <MapDisplay
                        showAddressBar={false}
                        regionID={postDetails.location.regionID}
                        exactLocation={true}
                        width={500}
                        height={300}
                    />
                </div>
            )}

            {/* Placeholder: Comments, Chat, Handshakes, etc. */}
            <div className='bg-white shadow p-4 rounded mb-6'>
                <MessageList
                    title='Comments'
                    messages={postDetails.messages || []}
                    callback={(response) =>
                        setPostDetails((prev) =>
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
                    postID={parseInt(postDetails.id)}
                    showSendMessage={user?.id !== postDetails.sender?.id}
                />
            </div>

            {/* TODO: handshakes section, chat modal, and report modal */}
            {/* Handshakes */}
            <div className='bg-white shadow p-4 rounded mb-6'>
                <h2 className='text-lg font-bold mb-2'>{postDetails.type === 'request' ? 'Offered By' : 'Requested By'}</h2>

                <Handshakes
                    handshakes={postDetails.handshakes.map(h => ({ ...h, post: postDetails }))}
                    sender={postDetails.sender}
                    currentUserId={user?.id}
                    showAll={showAllHandshakes}
                    onShowAll={() => setShowAllHandshakes(true)}
                    onHandshakeCreated={(newHandshake) =>
                        setPostDetails((prev) =>
                            prev
                                ? {
                                    ...prev,
                                    handshakes: [...(prev.handshakes || []), newHandshake]
                                }
                                : prev
                        )
                    }
                />

                {/* Create handshake button if not the sender */}
                {user?.id !== Number(postDetails.sender?.id) &&
                    !postDetails.handshakes?.some(
                        (h) => h.sender?.id === user?.id
                    ) && (
                    <div className='mt-4 flex justify-center'>
                        <button
                            onClick={handleSubmitHandshake}
                            className='bg-blue-600 text-white px-4 py-2 rounded'
                            disabled={creatingHandshake}
                        >
                            {creatingHandshake
                                ? 'Creating...'
                                : postDetails.type === 'gift' ? 'Request This' : 'Gift This'}
                        </button>
                    </div>
                )}
            </div>

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
                            <button
                                onClick={() => setReportModalVisible(false)}
                                className='px-4 py-2 bg-gray-300 rounded hover:bg-gray-400'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReport}
                                className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {modalVisible && selectedImage && (
                <div className='fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center'>
                    <div className='relative'>
                        <img
                            src={selectedImage}
                            alt='Preview'
                            className='max-w-full max-h-[90vh] rounded shadow-lg'
                        />
                        <button
                            onClick={() => setModalVisible(false)}
                            className='absolute top-2 right-2 text-white bg-black bg-opacity-50 px-3 py-1 rounded hover:bg-opacity-75'
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Post;
