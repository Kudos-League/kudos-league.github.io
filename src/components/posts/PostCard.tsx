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
        distance,
        type
    } = props;

    const { user } = useAuth();
    const navigate = useNavigate();

    console.log(
        'PostCard - Post ID:',
        id,
        'Images:',
        images,
        'Images length:',
        images?.length
    );

    const hasImages = images && images.length > 0;

    const viewerHandshake = getUserHandshake({ handshakes }, user?.id);

    const isClosed = status === 'closed';

    return (
        <div
            className={`relative border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition cursor-pointer w-full max-w-full overflow-hidden h-full flex flex-col ${
                isClosed ? 'opacity-60' : ''
            }`}
            onClick={() => navigate(`/post/${id}`)}
        >
            {/* Grey overlay for closed posts */}
            {isClosed && (
                <div className='absolute inset-0 bg-gray-400 dark:bg-gray-600 opacity-20 pointer-events-none rounded-lg z-10' />
            )}
            {/* Image Carousel - appears first on all sizes, images fill the space */}
            {hasImages && (
                <div
                    className='mb-3 -mx-3 -mt-3 rounded-t-lg overflow-hidden cursor-pointer h-60'
                    onClick={(e) => {
                        // Only navigate if clicking directly on the image, not on carousel controls
                        if (
                            e.target === e.currentTarget ||
                            (e.target as HTMLElement).tagName === 'IMG'
                        ) {
                            navigate(`/post/${id}`);
                        }
                        e.stopPropagation();
                    }}
                >
                    <ImageCarousel images={images} variant='postCard' />
                </div>
            )}

            {/* UserCard - always visible but compact on desktop */}
            {sender && (
                <div
                    className='mb-2 max-w-fit'
                    onClick={(e) => e.stopPropagation()}
                >
                    <UserCard user={sender} compact={true} showKudos={false} />
                </div>
            )}

            {/* Title */}
            <div className='flex items-start gap-2 mb-2'>
                {status === 'closed' && (
                    <span className='bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded whitespace-nowrap flex-shrink-0 mt-0.5'>
                        CLOSED
                    </span>
                )}
                <h2 className='text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100'>
                    {title}
                </h2>
            </div>

            {/* Distance and Date */}
            <div className='flex flex-wrap items-center gap-2 mb-2'>
                {distance != null && (
                    <Pill name={`${distance.toFixed(1)} km`} />
                )}
                <span className='text-xs text-gray-500 dark:text-gray-400'>
                    {timeAgoLabel(createdAt as any)}
                </span>
            </div>

            {/* Tags and Type Badge */}
            <div className='mb-2 flex flex-wrap gap-1 items-center'>
                {type && (
                    <span
                        className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                            type === 'gift'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}
                    >
                        {type.toUpperCase()}
                    </span>
                )}
                {tags.map((tag, i) => (
                    <Pill key={i} name={tag.name} />
                ))}
            </div>

            {/* Description - truncated on all sizes */}
            <TextWithLinks className='text-sm text-gray-600 dark:text-gray-300 line-clamp-3 flex-1'>
                {body}
            </TextWithLinks>

            {/* HandshakeCard or Closed Message - mobile only */}
            {showHandshakeShortcut && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className='block sm:hidden mt-4'
                >
                    {isClosed ? (
                        <div className='relative z-20 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 border-2 border-gray-400 dark:border-gray-500 rounded-lg p-4 text-center'>
                            <p className='text-lg font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide'>
                                🔒 This post is closed
                            </p>
                        </div>
                    ) : (
                        viewerHandshake &&
                        !viewerHandshake.cancelledAt && (
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
                        )
                    )}
                </div>
            )}
        </div>
    );
}
