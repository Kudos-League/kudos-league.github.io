import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserCard from '@/components/users/UserCard';
import { PostDTO } from '@/shared/api/types';
import { useAuth } from '@/contexts/useAuth';
import HandshakeCard from '@/components/handshakes/HandshakeCard';
import Pill from '@/components/common/Pill';
import TextWithLinks from '../common/TextWithLinks';
import { timeAgoLabel } from '@/shared/timeAgoLabel';
import ImageCarousel from '@/components/Carousel';

function truncateBody(body: string, max = 100) {
    return body.length <= max ? body : body.slice(0, max) + '…';
}

function getUserHandshake(post: Partial<PostDTO>, viewerID?: number) {
    if (!viewerID || !post.handshakes?.length) return;
    return post.handshakes.find(
        (h) => h.senderID === viewerID || h.receiverID === viewerID
    );
}

interface Props extends PostDTO {
    fake?: boolean;
    showHandshakeShortcut?: boolean;
}

export default function PostCard(props: Props) {
    const {
        id,
        title,
        body,
        images,
        sender,
        status,
        createdAt,
        handshakes,
        tags = [],
        fake,
        showHandshakeShortcut = false,
        distance
    } = props;

    const { user } = useAuth();
    const navigate = useNavigate();

    console.log('PostCard - Post ID:', id, 'Images:', images, 'Images length:', images?.length);

    const hasImages = images && images.length > 0;

    const viewerHandshake = getUserHandshake({ handshakes }, user?.id);

    return (
        <div
            className='relative border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-4 mb-3 sm:mb-6 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition cursor-pointer w-full max-w-full overflow-hidden'
            onClick={() => navigate(`/post/${id}`)}
        >

            {/* UserCard */}
            {sender && (
                <div className='mb-2 sm:mb-3 max-w-fit' onClick={(e) => e.stopPropagation()}>
                    <UserCard user={sender} />
                </div>
            )}

            {/* Distance and Date */}
            <div className='flex flex-wrap items-center gap-3 sm:gap-4 mb-3 sm:mb-4'>
                {distance != null && (
                    <Pill name={`${distance.toFixed(1)} km`} />
                )}
                <span className='text-[0.65rem] sm:text-xs text-gray-500 dark:text-gray-400'>
                    {timeAgoLabel(createdAt as any)}
                </span>
            </div>

            {/* Tags */}
            <div className='mb-3 sm:mb-4 flex flex-wrap gap-1'>
                {tags.map((tag, i) => (
                    <Pill key={i} name={tag.name} />
                ))}
            </div>

            {/* Title */}
            <div className='flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4'>
                {status === 'closed' && (
                    <span className='bg-red-600 text-white text-[0.65rem] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap flex-shrink-0 mt-0.5'>
                        CLOSED
                    </span>
                )}
                <h2 className='text-base sm:text-xl font-bold text-gray-800 dark:text-gray-100'>
                    {title}
                </h2>
            </div>

            {/* Image Carousel */}
            {hasImages && (
                <div className='w-full mb-3 sm:mb-4 px-0 sm:px-4' onClick={(e) => e.stopPropagation()}>
                    <ImageCarousel images={images} fullResolution={true} />
                </div>
            )}

            {/* Description */}
            <TextWithLinks className='text-sm sm:text-base text-gray-600 dark:text-gray-300 break-words max-h-48 overflow-hidden'>
                {body}
            </TextWithLinks>

            {/* HandshakeCard below image */}
            {viewerHandshake && showHandshakeShortcut && (
                <div onClick={(e) => e.stopPropagation()} className='mt-4'>
                    {!viewerHandshake.cancelledAt && (
                        <HandshakeCard
                            handshake={{
                                ...viewerHandshake,
                                post: props
                            }}
                            userID={user?.id}
                            showPostDetails={false}
                            showSenderOrReceiver='sender'
                            compact={true}
                            hideCardBorder={true}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
