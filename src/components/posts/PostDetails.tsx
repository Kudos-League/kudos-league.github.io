import React, { useState } from 'react';
import {
    ExclamationTriangleIcon,
    ArrowLeftIcon,
    QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { PencilSquareIcon } from '@heroicons/react/24/solid';

import MapDisplay from '@/components/Map';
import MessageList from '@/components/posts/MessageList';
// import ChatModal from '@/components/messages/ChatModal';
import ImageCarousel from '@/components/Carousel';
import ImageModalCarousel from '@/components/ImageModalCarousel';
import Handshakes from '@/components/handshakes/Handshakes';
import UserCard from '@/components/users/UserCard';
import TagInput from '@/components/TagInput';
import DropdownPicker from '@/components/forms/DropdownPicker';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useAuth } from '@/contexts/useAuth';
import { useBlockedUsers } from '@/contexts/useBlockedUsers';
import { useCategories } from '@/shared/api/queries/categories';
import { getHandshakeStage } from '@/shared/handshakeUtils';
import { apiMutate } from '@/shared/api/apiClient';
import { MAX_FILE_COUNT, MAX_FILE_SIZE_MB } from '@/shared/constants';
import { getImagePath } from '@/shared/api/config';
import { pushAlert } from '@/components/common/alertBus';
import {
    useUpdatePost,
    useLikePost,
    useReportPost,
    useCreateHandshake
} from '@/shared/api/mutations/posts';

import type {
    ChannelDTO,
    CreateHandshakeDTO,
    PostDTO,
    LocationDTO,
    UpdatePostDTO,
    CategoryDTO
} from '@/shared/api/types';
import Pill from '../common/Pill';
import Button from '../common/Button';
import TextWithLinks from '../common/TextWithLinks';
import { useNavigate } from 'react-router-dom';

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

function EditPostButton({
    onClick,
    disabled
}: {
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <Button
            onClick={onClick}
            className='inline-flex items-center gap-1 text-sm font-semibold'
            variant='secondary'
            disabled={disabled}
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
    const {
        blockedUsers,
        unblock,
        loading: blockingLoading
    } = useBlockedUsers();

    const updatePostMut = useUpdatePost();
    const likeMut = useLikePost();
    const reportMut = useReportPost();
    const createHsMut = useCreateHandshake();
    const { data: categories = [] } = useCategories();

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: '',
        body: '',
        tags: [] as string[],
        type: 'gift' as 'gift' | 'request',
        categoryID: null as number | null,
        location: null as LocationDTO | null,
        itemsLimit: '' as string
    });
    const [editImages, setEditImages] = useState<File[]>([]);
    const [editImageError, setEditImageError] = useState<string | null>(null);
    const [deletedImageIndices, setDeletedImageIndices] = useState<Set<number>>(
        new Set()
    );
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [imageModalIndex, setImageModalIndex] = useState(0);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [showAllHandshakes, setShowAllHandshakes] = useState(false);
    const [creatingHandshake, setCreatingHandshake] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [pendingRecipientID, setPendingRecipientID] = useState<number | null>(
        null
    );
    const [selectedChannel] = useState<ChannelDTO | null>(null);
    const [handshakeSuccessModal, setHandshakeSuccessModal] = useState(false);
    const [isHandshakeAlreadyCreated, setIsHandshakeAlreadyCreated] =
        useState(false);
    const [acceptingHighestKudos, setAcceptingHighestKudos] = useState(false);
    const [acceptHighestKudosModal, setAcceptHighestKudosModal] =
        useState(false);
    const [highestKudosHandshakeData, setHighestKudosHandshakeData] = useState<{
        handshake: any;
        username: string;
        kudos: number;
    } | null>(null);
    const [showKudosTooltip, setShowKudosTooltip] = useState(false);
    const navigate = useNavigate();

    const sortHandshakesWithUserFirst = (
        handshakes: any[],
        userId?: number
    ) => {
        if (!userId || !handshakes?.length) return handshakes || [];

        return [...handshakes].sort((a, b) => {
            const aIsUser =
                a.senderID === userId ||
                a.receiverID === userId ||
                a.recipientID === userId;
            const bIsUser =
                b.senderID === userId ||
                b.receiverID === userId ||
                b.recipientID === userId;

            // User's handshakes always come first
            if (aIsUser && !bIsUser) return -1;
            if (!aIsUser && bIsUser) return 1;

            // For non-user handshakes, sort by sender's kudos (descending)
            if (!aIsUser && !bIsUser) {
                const aKudos = a.sender?.kudos || 0;
                const bKudos = b.sender?.kudos || 0;
                if (aKudos !== bKudos) {
                    return bKudos - aKudos;
                }
            }

            // If both are user handshakes or kudos are equal, sort by date
            return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
        });
    };

    const updateStatus = async (newStatus: string) => {
        if (!postDetails) return;
        try {
            const updated = await updatePostMut.mutateAsync({
                id: postDetails.id,
                data: { status: newStatus }
            });
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

    const handleSubmitHandshake = async () => {
        if (!token) {
            console.error('No token. Please register or log in.');
            return;
        }

        if (!postDetails) {
            console.error('Post details are not loaded.');
            return;
        }

        setCreatingHandshake(true);

        try {
            const handshakeData: CreateHandshakeDTO = {
                postID: postDetails.id,
                senderID: user?.id || 0,
                receiverID: postDetails.sender?.id || 0,
                type: postDetails.type,
                status: 'new'
            };

            const newHandshake = await createHsMut.mutateAsync(handshakeData);

            setPostDetails((prevDetails: PostDTO | undefined) => {
                if (!prevDetails) return prevDetails as any;
                return {
                    ...prevDetails,
                    handshakes: [
                        ...(prevDetails.handshakes || []),
                        newHandshake
                    ]
                } as PostDTO;
            });

            setPendingRecipientID(postDetails.sender?.id || null);
            setIsHandshakeAlreadyCreated(true);
            setHandshakeSuccessModal(true);
            fetchPostDetails?.(postDetails.id);
        }
        catch (error) {
            console.error('Error creating handshake:', error);
            pushAlert({
                type: 'danger',
                message: 'Failed to create handshake. Please try again.'
            });
        }
        finally {
            setCreatingHandshake(false);
        }
    };

    const handleOpenChatFromSuccess = async () => {
        if (!user?.id || !postDetails?.senderID) return;
        try {
            // Create or get DM channel with the post owner
            await apiMutate('/channels', 'post', {
                name: `DM: User ${user.id} & User ${postDetails.senderID}`,
                channelType: 'dm',
                userIDs: [user.id, postDetails.senderID]
            });
            // Navigate to the specific chat
            navigate(`/dms/${postDetails.senderID}`);
        }
        catch (err) {
            console.error('Failed to create or get DM channel', err);
            pushAlert({
                type: 'danger',
                message: 'Failed to start a direct message. Please try again.'
            });
        }
    };

    const handleCloseChatModal = (open: boolean) => {
        setIsChatOpen(open);
        if (!open && isHandshakeAlreadyCreated) {
            setIsHandshakeAlreadyCreated(false);
        }
    };

    const handleMessageSent = async () => {
        if (isHandshakeAlreadyCreated) {
            setIsChatOpen(false);
            setIsHandshakeAlreadyCreated(false);
            return;
        }

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
                receiverID: recipientId,
                type: postDetails.type,
                status: 'new'
            };

            console.log('Sending handshake data:', handshakeData);
            const newHandshake = await createHsMut.mutateAsync(handshakeData);

            setPostDetails((prevDetails: PostDTO | undefined) => {
                if (!prevDetails) return prevDetails as any;
                return {
                    ...prevDetails,
                    handshakes: [
                        ...(prevDetails.handshakes || []),
                        newHandshake
                    ]
                } as PostDTO;
            });

            pushAlert({
                type: 'success',
                message:
                    'Handshake created successfully! You can now coordinate the details with the post owner.'
            });
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
        if (isHandshakeAlreadyCreated) {
            setIsHandshakeAlreadyCreated(false);
            return;
        }

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
                receiverID: recipientId,
                type: postDetails.type,
                status: 'new'
            };

            console.log('Sending handshake data:', handshakeData);
            const newHandshake = await createHsMut.mutateAsync(handshakeData);

            setPostDetails((prevDetails: PostDTO | undefined) => {
                if (!prevDetails) return prevDetails as any;
                return {
                    ...prevDetails,
                    handshakes: [
                        ...(prevDetails.handshakes || []),
                        newHandshake
                    ]
                } as PostDTO;
            });

            pushAlert({
                type: 'success',
                message:
                    'Handshake created successfully! You can now coordinate the details with the post owner.'
            });
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

            const updatedMessages = (prev.messages || []).map((msg) =>
                msg.id === deletedMessageId
                    ? {
                        ...msg,
                        deletedAt: new Date().toISOString(),
                        content: `[deleted message]`
                    }
                    : msg
            );

            return {
                ...prev,
                messages: updatedMessages
            };
        });
    };

    const handleHandshakeDeleted = (id: number) => {
        if (!postDetails) return;
        setPostDetails((prev: PostDTO | undefined) => {
            if (!prev) return prev as any;
            return {
                ...prev,
                handshakes: (prev.handshakes || []).filter(
                    (h: { id: number }) => h.id !== id
                )
            } as PostDTO;
        });
    };

    const handleReport = async () => {
        if (!postDetails) return;
        if (!reportReason.trim()) {
            pushAlert({
                type: 'warning',
                message: 'Please enter a reason for reporting.'
            });
            return;
        }

        try {
            await reportMut.mutateAsync({
                id: postDetails.id,
                reason: reportReason.trim()
            });
            pushAlert({
                type: 'success',
                message: 'Post reported successfully.'
            });
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
                regionID: data.placeID,
                latitude: data.coordinates.latitude,
                longitude: data.coordinates.longitude
            };
            setEditData({ ...editData, location: locationData });
        }
    };

    const validateFiles = (files?: File[]) => {
        if (!files) return null;
        if (files.length > MAX_FILE_COUNT)
            return `Max ${MAX_FILE_COUNT} files allowed.`;
        const tooLarge = files.find(
            (f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024
        );
        if (tooLarge) return `Files must be under ${MAX_FILE_SIZE_MB}MB.`;
        return null;
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const updated = [...editImages, ...Array.from(files)];
        const fileError = validateFiles(updated);
        if (fileError) {
            setEditImageError(fileError);
            return;
        }
        setEditImages(updated);
        setEditImageError(null);
        e.target.value = '';
    };

    const removeEditImage = (idx: number) => {
        setEditImages((prev) => prev.filter((_, i) => i !== idx));
    };

    const removeExistingImage = (idx: number) => {
        setDeletedImageIndices((prev) => {
            const next = new Set(prev);
            next.add(idx);
            return next;
        });
    };

    const createImagePreview = (f: File) => URL.createObjectURL(f);

    const handleStartEdit = () => {
        if (!postDetails) return;

        const isMobile = window.innerWidth < 768; // md breakpoint

        if (isMobile) {
            navigate(`/post/${postDetails.id}/edit`);
            return;
        }

        setEditData({
            title: postDetails.title,
            body: postDetails.body,
            tags: postDetails.tags?.map((tag) => tag.name) || [],
            type: postDetails.type as 'gift' | 'request',
            categoryID: postDetails.category?.id || null,
            location: postDetails.location || null,
            itemsLimit:
                typeof postDetails.itemsLimit === 'number' &&
                postDetails.itemsLimit > 0
                    ? String(postDetails.itemsLimit)
                    : ''
        });
        setEditImages([]);
        setEditImageError(null);
        setDeletedImageIndices(new Set());
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        if (!postDetails) return;

        const fileError = validateFiles(editImages);
        if (fileError) {
            setEditImageError(fileError);
            return;
        }

        try {
            const updateData: any = {
                title: editData.title,
                body: editData.body,
                tags: editData.tags,
                type: editData.type,
                categoryID: editData.categoryID
            };

            // Handle location changes (including deletion)
            if (editData.location !== postDetails.location) {
                updateData.location = editData.location;
            }

            const limitStr = (editData.itemsLimit || '').trim();
            if (limitStr === '') updateData.itemsLimit = null;
            else if (/^\d+$/.test(limitStr))
                updateData.itemsLimit = Math.max(1, parseInt(limitStr, 10));

            if (editImages.length > 0) {
                updateData.files = editImages;
            }

            // Always send remaining images (with deleted ones filtered out)
            const remainingImages =
                postDetails.images?.filter(
                    (_, idx) => !deletedImageIndices.has(idx)
                ) || [];
            updateData.images = remainingImages;

            const updated = await updatePostMut.mutateAsync({
                id: postDetails.id,
                data: updateData
            });
            setPostDetails({ ...postDetails, ...updated });
            setEditImages([]);
            setEditImageError(null);
            setDeletedImageIndices(new Set());
            setIsEditing(false);
        }
        catch (err) {
            console.error('Failed to save changes', err);
            setEditImageError(
                err instanceof Error ? err.message : 'Failed to save changes'
            );
        }
    };

    const handleAcceptHighestKudos = () => {
        if (!postDetails || !user) return;

        const pendingHandshakes = (postDetails.handshakes || []).filter(
            (h: any) => h.status === 'new'
        );

        if (pendingHandshakes.length === 0) {
            pushAlert({
                type: 'warning',
                message: 'No pending handshakes to accept.'
            });
            return;
        }

        const highestKudosHandshake = pendingHandshakes.reduce(
            (highest, current) => {
                const currentSender = current.sender || { kudos: 0 };
                const highestSender = highest.sender || { kudos: 0 };
                return (currentSender.kudos || 0) > (highestSender.kudos || 0)
                    ? current
                    : highest;
            }
        );

        if (!highestKudosHandshake) {
            pushAlert({
                type: 'danger',
                message: 'Could not find handshake to accept.'
            });
            return;
        }

        // Show confirmation modal
        setHighestKudosHandshakeData({
            handshake: highestKudosHandshake,
            username: highestKudosHandshake.sender?.username || 'user',
            kudos: highestKudosHandshake.sender?.kudos || 0
        });
        setAcceptHighestKudosModal(true);
    };

    const confirmAcceptHighestKudos = async () => {
        if (!highestKudosHandshakeData || !postDetails) return;

        setAcceptingHighestKudos(true);

        try {
            await apiMutate(
                `/handshakes/${highestKudosHandshakeData.handshake.id}`,
                'patch',
                { status: 'accepted' }
            );

            setPostDetails((prev: PostDTO) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    handshakes: (prev.handshakes || []).map((h: any) =>
                        h.id === highestKudosHandshakeData.handshake.id
                            ? { ...h, status: 'accepted' }
                            : h
                    )
                };
            });

            pushAlert({
                type: 'success',
                message: `Successfully accepted handshake from ${highestKudosHandshakeData.username}!`
            });

            if (fetchPostDetails) {
                fetchPostDetails(postDetails.id);
            }
        }
        catch (err) {
            console.error('Failed to accept handshake:', err);
            pushAlert({
                type: 'danger',
                message: 'Failed to accept handshake. Please try again.'
            });
        }
        finally {
            setAcceptingHighestKudos(false);
            setAcceptHighestKudosModal(false);
            setHighestKudosHandshakeData(null);
        }
    };

    if (loading) {
        return <div className='text-center mt-20 text-lg'>Loading post...</div>;
    }

    if (error) {
        const isBlockedUser =
            postDetails?.sender?.id &&
            (blockedUsers ?? []).includes(postDetails.sender.id);

        if (isBlockedUser && postDetails?.sender) {
            return (
                <div className='text-center mt-20 max-w-md mx-auto px-4'>
                    <div className='bg-gray-100 dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700'>
                        <div className='mb-4'>
                            <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center'>
                                <svg
                                    className='w-8 h-8 text-red-600 dark:text-red-400'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
                                    />
                                </svg>
                            </div>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                                Post from Blocked User
                            </h3>
                            <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
                                This post is from{' '}
                                <span className='font-semibold'>
                                    {postDetails.sender.displayName ||
                                        postDetails.sender.username}
                                </span>
                                , whom you have blocked. You cannot view their
                                content.
                            </p>
                        </div>

                        <div className='flex flex-col gap-2'>
                            <Button
                                onClick={async () => {
                                    if (
                                        blockingLoading ||
                                        !postDetails.sender?.id
                                    )
                                        return;
                                    try {
                                        await unblock(postDetails.sender.id);
                                        if (
                                            fetchPostDetails &&
                                            postDetails?.id
                                        ) {
                                            setTimeout(
                                                () =>
                                                    fetchPostDetails(
                                                        postDetails.id
                                                    ),
                                                300
                                            );
                                        }
                                    }
                                    catch (err) {
                                        console.error(
                                            'Failed to unblock user:',
                                            err
                                        );
                                    }
                                }}
                                disabled={blockingLoading}
                                variant='primary'
                                className='w-full justify-center'
                            >
                                {blockingLoading
                                    ? 'Unblocking...'
                                    : 'Unblock User'}
                            </Button>
                            <Button
                                onClick={() => window.history.back()}
                                variant='secondary'
                                className='w-full justify-center'
                            >
                                Go Back
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

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

    const isPostOwner = user?.id === postDetails.sender?.id;
    const hasPendingHandshakes = (postDetails.handshakes || []).some(
        (h: any) => h.status === 'new'
    );
    const showAcceptHighestKudosButton =
        isPostOwner && hasPendingHandshakes && postDetails.status !== 'closed';

    return (
        <div className='max-w-4xl mx-auto p-4 min-height-dvh'>
            {/* Overlay when editing */}
            {isEditing && (
                <div
                    className='fixed inset-0 z-50 bg-black/50 cursor-pointer'
                    onClick={() => {
                        setIsEditing(false);
                        setEditImages([]);
                        setEditImageError(null);
                        setDeletedImageIndices(new Set());
                    }}
                    style={{ pointerEvents: 'auto' }}
                />
            )}

            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className='mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200'
                aria-label='Go back'
            >
                <ArrowLeftIcon className='w-5 h-5 stroke-2' />
                <span className='text-sm font-medium'>Back</span>
            </button>

            {/* Header: User Card and Action Buttons */}
            <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3 sm:gap-4'>
                <div className='flex-1 min-w-0'>
                    <UserCard user={postDetails.sender} large />
                </div>

                {/* Post Owner Actions */}
                {isPostOwner && (
                    <div className='flex flex-row gap-2 flex-shrink-0'>
                        <EditPostButton
                            onClick={handleStartEdit}
                            disabled={isEditing}
                        />
                        {postDetails.status !== 'closed' && (
                            <Button
                                onClick={handleClosePost}
                                className='inline-flex items-center gap-1 text-sm font-semibold whitespace-nowrap'
                                variant='danger'
                                disabled={isEditing}
                            >
                                Close Post
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Title */}
            <div className='mb-4'>
                <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 break-words'>
                    {postDetails.title}
                </h1>
            </div>

            {/* Metadata Card - Redesigned with Mobile Optimization */}
            <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 mb-4 shadow-sm'>
                <div className='flex flex-wrap gap-2 sm:gap-3 items-center'>
                    {/* Type Badge */}
                    <Pill
                        tone={
                            postDetails.type === 'request' ? 'info' : 'success'
                        }
                        className='uppercase font-semibold text-xs'
                    >
                        {postDetails.type}
                    </Pill>

                    {/* Status Badge */}
                    {postDetails.status === 'closed' ? (
                        <Pill
                            tone='danger'
                            className='uppercase font-semibold text-xs'
                        >
                            CLOSED
                        </Pill>
                    ) : (
                        <Pill tone='neutral' className='uppercase text-xs'>
                            {postDetails.status}
                        </Pill>
                    )}

                    {/* Category */}
                    {postDetails.category?.name && (
                        <div className='flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2.5 sm:px-3 py-1 rounded-full'>
                            <span className='font-medium'>
                                {postDetails.category.name}
                            </span>
                        </div>
                    )}

                    {/* Items Limit */}
                    {typeof postDetails.itemsLimit === 'number' &&
                        postDetails.itemsLimit > 0 && (
                        <div className='flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 sm:px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800'>
                            <span className='font-medium'>
                                {postDetails.itemsLimit}{' '}
                                {postDetails.itemsLimit === 1
                                    ? 'item'
                                    : 'items'}{' '}
                                    max
                            </span>
                        </div>
                    )}

                    {/* Tags - Full width on mobile for better readability */}
                    {postDetails.tags && postDetails.tags.length > 0 && (
                        <>
                            {/* Visual break on mobile */}
                            <div className='w-full sm:hidden'></div>
                            <div className='flex flex-wrap items-center gap-1.5 sm:gap-2'>
                                {postDetails.tags.map((tag, i) => (
                                    <Pill key={i} name={tag.name} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Body / Description - Enhanced Edit Form */}
            {isEditing ? (
                <div
                    className='bg-white dark:bg-gray-800 p-6 border dark:border-gray-700 rounded-lg space-y-4 text-gray-900 dark:text-gray-100 z-50 fixed top-20 left-4 right-4 max-w-4xl mx-auto w-[calc(100%-2rem)] max-h-[calc(100vh-8rem)] overflow-y-auto'
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setEditImages([]);
                            setEditImageError(null);
                            setDeletedImageIndices(new Set());
                        }}
                        className='absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                        aria-label='Close edit form'
                        title='Close'
                    >
                        <svg
                            className='w-5 h-5 text-gray-500 dark:text-gray-400'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                            />
                        </svg>
                    </button>
                    <h3 className='text-lg font-semibold pr-8'>Edit Post</h3>

                    <div className='flex gap-3'>
                        <Button
                            variant={
                                editData.type === 'gift'
                                    ? 'primary'
                                    : 'secondary'
                            }
                            onClick={() =>
                                setEditData({
                                    ...editData,
                                    type: 'gift'
                                })
                            }
                        >
                            Give stuff
                        </Button>
                        <Button
                            variant={
                                editData.type === 'request'
                                    ? 'primary'
                                    : 'secondary'
                            }
                            onClick={() =>
                                setEditData({
                                    ...editData,
                                    type: 'request'
                                })
                            }
                        >
                            Request stuff
                        </Button>
                    </div>

                    <div>
                        <label className='block text-sm font-medium mb-1'>
                            Category
                        </label>
                        <DropdownPicker
                            options={categories.map((c: CategoryDTO) => ({
                                label: c.name,
                                value: String(c.id)
                            }))}
                            value={
                                editData.categoryID !== null
                                    ? String(editData.categoryID)
                                    : ''
                            }
                            onChange={(val) => {
                                const parsed = val ? parseInt(val) : null;
                                setEditData({
                                    ...editData,
                                    categoryID: parsed
                                });
                            }}
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium mb-1'>
                            Title
                        </label>
                        <input
                            className='w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
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

                    <div>
                        <label className='block text-sm font-medium mb-1'>
                            Description
                        </label>
                        <textarea
                            className='w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto'
                            style={{
                                WebkitOverflowScrolling: 'touch',
                                touchAction: 'pan-y'
                            }}
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

                    <div>
                        <TagInput
                            initialTags={editData.tags}
                            onTagsChange={handleTagsChange}
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium mb-2'>
                            Location
                        </label>

                        {editData.location && (
                            <div className='mb-2 flex items-center justify-between gap-2'>
                                <div className='text-sm text-gray-700 dark:text-gray-300 truncate'>
                                    {editData.location.name || 'Location set'}
                                </div>
                                <Button
                                    type='button'
                                    variant='ghost'
                                    onClick={() =>
                                        setEditData({
                                            ...editData,
                                            location: null
                                        })
                                    }
                                    className='!text-red-600 hover:!text-red-700 !text-sm flex-shrink-0'
                                >
                                    ✕ Remove
                                </Button>
                            </div>
                        )}

                        <MapDisplay
                            key={editData.location?.regionID || 'no-location'}
                            edit
                            regionID={editData.location?.regionID}
                            height={300}
                            exactLocation={isPostOwner}
                            onLocationChange={handleLocationChange}
                            shouldSavedLocationButton
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium mb-1'>
                            Number of items if applicable (leave blank for
                            unlimited, 1 in case of doubt or non applicable)
                        </label>
                        <input
                            className='w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            inputMode='numeric'
                            pattern='[0-9]*'
                            placeholder='e.g., 1'
                            value={editData.itemsLimit}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    itemsLimit: e.target.value.replace(
                                        /[^0-9]/g,
                                        ''
                                    )
                                })
                            }
                        />
                        <p className='text-xs text-gray-500 mt-1'>
                            Limits how many accepted/completed handshakes the
                            post can have.
                        </p>
                    </div>

                    <div className='w-full overflow-hidden box-border'>
                        <label className='block text-sm font-semibold mb-2'>
                            Images (
                            {(postDetails.images?.length || 0) -
                                deletedImageIndices.size +
                                editImages.length}
                            /{MAX_FILE_COUNT})
                        </label>
                        {editImageError && (
                            <p className='text-sm text-red-600 dark:text-red-400 mb-2'>
                                {editImageError}
                            </p>
                        )}
                        <input
                            type='file'
                            accept='image/*'
                            multiple
                            onChange={handleImageUpload}
                            className='border border-gray-300 dark:border-gray-700 rounded-lg w-full box-border px-3 py-2 mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 truncate text-ellipsis overflow-hidden min-w-0 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-100 hover:file:bg-blue-100 dark:hover:file:bg-blue-800'
                            disabled={
                                (postDetails.images?.length || 0) -
                                    deletedImageIndices.size +
                                    editImages.length >=
                                MAX_FILE_COUNT
                            }
                        />
                        {((postDetails.images &&
                            postDetails.images.length > 0) ||
                            editImages.length > 0) && (
                            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 pr-2'>
                                {/* Existing images from the post */}
                                {postDetails.images?.map((url, index) => {
                                    if (deletedImageIndices.has(index))
                                        return null;
                                    const imagePath = getImagePath(url);
                                    if (!imagePath) return null;
                                    return (
                                        <div
                                            key={`existing-${index}`}
                                            className='relative group'
                                        >
                                            <img
                                                src={imagePath}
                                                alt={`Image ${index + 1}`}
                                                className='w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600'
                                            />
                                            <Button
                                                type='button'
                                                shape='circle'
                                                variant='danger'
                                                onClick={() =>
                                                    removeExistingImage(index)
                                                }
                                                className='absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-sm opacity-100 shadow-md'
                                                title='Remove image'
                                            >
                                                ×
                                            </Button>
                                            <div className='absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded'>
                                                Current
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* New images being added */}
                                {editImages.map((file, index) => (
                                    <div
                                        key={`new-${index}`}
                                        className='relative group'
                                    >
                                        <img
                                            src={createImagePreview(file)}
                                            alt={`Preview ${index + 1}`}
                                            className='w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600'
                                        />
                                        <Button
                                            type='button'
                                            shape='circle'
                                            variant='danger'
                                            onClick={() =>
                                                removeEditImage(index)
                                            }
                                            className='absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-sm opacity-100 shadow-md'
                                            title='Remove image'
                                        >
                                            ×
                                        </Button>
                                        <div className='absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded'>
                                            New
                                        </div>
                                        <div className='text-xs text-gray-500 dark:text-gray-400 mt-1 truncate'>
                                            {file.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className='flex gap-3 pt-4'>
                        <Button variant='success' onClick={handleSaveEdit}>
                            Save Changes
                        </Button>
                        <Button
                            variant='secondary'
                            onClick={() => {
                                setIsEditing(false);
                                setEditImages([]);
                                setEditImageError(null);
                                setDeletedImageIndices(new Set());
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Images */}
                    <div className='mb-6'>
                        <ImageCarousel
                            images={postDetails.images || []}
                            variant='postDetails'
                            onImageClick={(index) => {
                                setImageModalVisible(true);
                                setImageModalIndex(index);
                            }}
                        />
                    </div>

                    {/* Body / Description */}
                    <div className='bg-gray-100 dark:bg-gray-800 rounded p-4 mb-6'>
                        <TextWithLinks className='text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words'>
                            {postDetails.body}
                        </TextWithLinks>
                        {postDetails.rewardOffers?.[0]?.kudosFinal && (
                            <p className='mt-2 font-semibold text-blue-600 dark:text-blue-400'>
                                Final Kudos:{' '}
                                {postDetails.rewardOffers[0].kudosFinal}
                            </p>
                        )}
                    </div>

                    {/* User Interaction Actions (Report) */}
                    {!isPostOwner && (
                        <div className='flex gap-2 items-center mb-6'>
                            <button
                                onClick={() => setReportModalVisible(true)}
                                title='Report'
                                className='px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-yellow-900 hover:text-yellow-600 transition flex items-center gap-2'
                            >
                                <ExclamationTriangleIcon className='w-5 h-5' />
                                <span>Report</span>
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Map */}
            {(postDetails.location?.regionID ||
                (postDetails.location?.latitude &&
                    postDetails.location?.longitude)) && (
                <div className='mb-6 flex justify-center'>
                    <MapDisplay
                        edit={false}
                        exactLocation={isPostOwner}
                        regionID={postDetails.location?.regionID}
                        coordinates={
                            postDetails.location?.latitude &&
                            postDetails.location?.longitude
                                ? {
                                    latitude: postDetails.location.latitude,
                                    longitude: postDetails.location.longitude
                                }
                                : undefined
                        }
                        onLocationChange={handleLocationChange}
                        width={500}
                        height={300}
                    />
                </div>
            )}

            {/* Handshakes */}
            <div className='shadow p-4 rounded mb-6'>
                <div className='flex items-center justify-between mb-4'>
                    <h2 className='text-lg font-bold'>
                        {postDetails.type === 'request' ? 'Offers' : 'Requests'}
                    </h2>

                    {showAcceptHighestKudosButton && (
                        <div className='flex items-center gap-2'>
                            <Button
                                onClick={handleAcceptHighestKudos}
                                disabled={acceptingHighestKudos || isEditing}
                                variant='success'
                                className='flex items-center gap-2'
                            >
                                {acceptingHighestKudos ? (
                                    <>
                                        <span className='animate-spin'>⏳</span>
                                        Accepting...
                                    </>
                                ) : (
                                    <>⭐ Accept Highest Kudos</>
                                )}
                            </Button>
                            <div className='relative group'>
                                <button
                                    type='button'
                                    onClick={() => setShowKudosTooltip(!showKudosTooltip)}
                                    onMouseEnter={() => setShowKudosTooltip(true)}
                                    onMouseLeave={() => setShowKudosTooltip(false)}
                                    className='text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors'
                                    aria-label='Help information'
                                >
                                    <QuestionMarkCircleIcon className='w-5 h-5' />
                                </button>
                                {showKudosTooltip && (
                                    <div className='absolute right-0 top-8 z-50 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg'>
                                        <div className='absolute -top-1 right-2 w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45'></div>
                                        Automatically accepts the help request with the highest kudos. If multiple offers have the same kudos, one will be chosen randomly.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <Handshakes
                    handshakes={sortHandshakesWithUserFirst(
                        (postDetails.handshakes || []).map((h) => ({
                            ...h,
                            post: postDetails,
                            _stage: getHandshakeStage(
                                { ...h, post: postDetails },
                                user?.id
                            )
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
                    onHandshakeInteraction={() => {
                        // Refetch post details to update all handshake cards immediately
                        if (fetchPostDetails && postDetails?.id) {
                            fetchPostDetails(postDetails.id);
                        }
                    }}
                    showPostDetails={false}
                    showSenderOrReceiver={'sender'}
                    showUserKudos={true}
                />

                {postDetails.status !== 'closed' &&
                    user?.id !== Number(postDetails.sender?.id) &&
                    !postDetails.handshakes?.some(
                        (h: any) =>
                            h.senderID === user?.id && h.status !== 'cancelled'
                    ) && (
                    <div className='mt-4 flex justify-center'>
                        <Button
                            onClick={handleSubmitHandshake}
                            disabled={creatingHandshake || isEditing}
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

            {/* Comments */}
            <div className='p-4 mb-6'>
                <MessageList
                    title=''
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
                    showSendMessage={!!user && !isEditing}
                    allowDelete={!!user && !isEditing}
                    allowEdit={!!user && !isEditing}
                    onMessageUpdate={handleMessageUpdate}
                    onMessageDelete={handleMessageDelete}
                />
            </div>

            {/* Chat Modal */}
            {/* {isChatOpen && (
                <ChatModal
                    isChatOpen={isChatOpen}
                    setIsChatOpen={handleCloseChatModal}
                    recipientID={pendingRecipientID || 0}
                    selectedChannel={selectedChannel}
                    onChannelCreated={handleChannelCreated}
                    initialMessage=""
                    onMessageSent={handleMessageSent}
                />
            )} */}

            {/* Report Modal */}
            {reportModalVisible && (
                <div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center'>
                    <div className='bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl text-gray-900 dark:text-gray-100'>
                        <h2 className='text-xl font-bold mb-2'>Report Post</h2>
                        <p className='text-sm text-gray-600 dark:text-gray-300 mb-4'>
                            Why are you reporting this post?
                        </p>
                        <textarea
                            className='w-full border border-gray-300 dark:border-gray-700 rounded p-2 mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 overflow-y-auto'
                            style={{
                                WebkitOverflowScrolling: 'touch',
                                touchAction: 'pan-y'
                            }}
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

            {/* Handshake Success Modal */}
            {handshakeSuccessModal && (
                <div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4'>
                    <div className='bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl text-gray-900 dark:text-gray-100'>
                        <div className='text-center mb-4'>
                            <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4'>
                                <svg
                                    className='h-8 w-8 text-green-600 dark:text-green-400'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M5 13l4 4L19 7'
                                    />
                                </svg>
                            </div>
                            <h2 className='text-2xl font-bold mb-3'>
                                Help request/offer Created!
                            </h2>
                            <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
                                Your help request/offer has been successfully
                                created. The post owner has been notified.
                            </p>
                            <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4'>
                                <p className='text-xs text-blue-800 dark:text-blue-200'>
                                    💡 You can message the post owner now to
                                    coordinate details, or do it later from your
                                    handshakes page.
                                </p>
                            </div>
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Button
                                onClick={handleOpenChatFromSuccess}
                                variant='primary'
                                className='w-full justify-center'
                            >
                                💬 Message Post Owner
                            </Button>
                            <Button
                                onClick={() => setHandshakeSuccessModal(false)}
                                variant='secondary'
                                className='w-full justify-center'
                            >
                                I&apos;ll Message Later
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal Carousel */}
            {imageModalVisible &&
                postDetails.images &&
                postDetails.images.length > 0 && (
                <ImageModalCarousel
                    images={postDetails.images}
                    initialIndex={imageModalIndex}
                    onClose={() => setImageModalVisible(false)}
                />
            )}

            {/* Accept Highest Kudos Confirmation Modal */}
            <ConfirmationModal
                isOpen={acceptHighestKudosModal}
                onClose={() => {
                    setAcceptHighestKudosModal(false);
                    setHighestKudosHandshakeData(null);
                }}
                onConfirm={confirmAcceptHighestKudos}
                title='Accept Highest Kudos'
                message={
                    highestKudosHandshakeData
                        ? `You're about to accept the help request from ${highestKudosHandshakeData.username} (${highestKudosHandshakeData.kudos} Kudos), which has the highest kudos among pending offers. ${
                            (postDetails?.handshakes || []).filter(
                                (h: any) =>
                                    h.status === 'new' &&
                                    (h.sender?.kudos || 0) === highestKudosHandshakeData.kudos
                            ).length > 1
                                ? 'Note: Multiple offers have the same kudos amount.'
                                : ''
                        }`
                        : ''
                }
                confirmText='Accept'
                cancelText='Cancel'
                variant='info'
            />
        </div>
    );
}
