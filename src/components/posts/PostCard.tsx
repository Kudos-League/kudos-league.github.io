import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImagePath } from '@/shared/api/config';
import UserCard from '@/components/users/UserCard';
import { PostDTO } from '@/shared/api/types';
import { useAuth } from '@/contexts/useAuth';
import HandshakeCard from '@/components/handshakes/HandshakeCard';
import Pill from '@/components/common/Pill';
import TextWithLinks from '../common/TextWithLinks';
import { timeAgoLabel } from '@/shared/timeAgoLabel';

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
    const [imgError, setImgError] = useState(false);

    console.log('PostCard - Post ID:', id, 'Images:', images, 'Images length:', images?.length);

    const imageSrc = fake
        ? images?.[0]
        : images?.[0]
            ? getImagePath(images[0])
            : undefined;
    const showBodyInImageBox = imgError || !images?.length || !imageSrc;

    console.log('PostCard - Post ID:', id, 'imageSrc:', imageSrc, 'showBodyInImageBox:', showBodyInImageBox);

    const viewerHandshake = getUserHandshake({ handshakes }, user?.id);

    return (
        <div
            className='relative border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-4 pb-4 sm:pb-4 mb-3 sm:mb-6 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition cursor-pointer'
            onClick={() => navigate(`/post/${id}`)}
        >
            <div className='flex justify-between items-start gap-2 sm:gap-4 w-full'>
                <div className='flex-1 pr-2 sm:pr-4 w-4/5'>
                    <div className='flex items-center justify-between gap-1 sm:gap-2 mb-1 sm:mb-2'>
                        <div className='flex items-center gap-1 sm:gap-2 min-w-0'>
                            {status === 'closed' && (
                                <span className='bg-red-600 text-white text-[0.65rem] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap'>
                                    CLOSED
                                </span>
                            )}
                            <h2 className='text-sm sm:text-lg font-bold break-words text-gray-800 dark:text-gray-100 truncate'>
                                {title}
                            </h2>
                            {distance != null && (
                                <span className='hidden sm:inline'>
                                    <Pill name={`${distance.toFixed(1)} km`} />
                                </span>
                            )}
                        </div>
                        <span className='text-[0.65rem] sm:text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap'>
                            {timeAgoLabel(createdAt as any)}
                        </span>
                    </div>

                    {sender && (
                        <div className='mb-1 sm:mb-2' onClick={(e) => e.stopPropagation()}>
                            <UserCard user={sender} />
                        </div>
                    )}
                    <div className='my-1 sm:my-2'>
                        {tags.map((tag, i) => (
                            <Pill key={i} name={tag.name} />
                        ))}
                    </div>
                    <TextWithLinks className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 sm:line-clamp-3 mr-1 sm:mr-2 break-words mt-4'>
                        {body}
                    </TextWithLinks>
                </div>
                <div className='w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center mt-1 sm:mt-2 overflow-hidden'>
                    {showBodyInImageBox ? (
                        <div className='w-full h-full bg-gray-100 dark:bg-gray-700 text-[0.65rem] sm:text-xs text-gray-600 dark:text-gray-300 rounded flex items-center justify-center text-center p-1 sm:p-2 overflow-hidden'>
                            {truncateBody(body, 60)}
                        </div>
                    ) : (
                        <img
                            src={imageSrc}
                            alt={title}
                            className='w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg'
                            onError={() => setImgError(true)}
                        />
                    )}
                </div>
            </div>

            {viewerHandshake && showHandshakeShortcut && (
                <div className='mt-4 relative' onClick={(e) => e.stopPropagation()}>
                    {!viewerHandshake.cancelledAt && (
                        <HandshakeCard
                            handshake={{
                                ...viewerHandshake,
                                post: props
                            }}
                            userID={user?.id}
                            showPostDetails={false}
                            showSenderOrReceiver='sender'
                        />
                    )}
                    {/* Distance indicator on top of handshake card on mobile */}
                    {distance != null && (
                        <div className='sm:hidden absolute -top-10 right-2 mt-2'>
                            <Pill name={`${distance.toFixed(1)} km away`} />
                        </div>
                    )}
                </div>
            )}

            {/* Distance indicator on mobile - bottom right (only when no handshake card) */}
            {distance != null && (!viewerHandshake || !showHandshakeShortcut) && (
                <div className='sm:hidden absolute bottom-2 right-2 mt-4'>
                    <Pill name={`${distance.toFixed(1)} km away`} />
                </div>
            )}
        </div>
    );
}
