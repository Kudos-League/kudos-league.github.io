import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImagePath } from '@/shared/api/config';
import UserCard from '@/components/users/UserCard';
import ImageCarousel from '@/components/Carousel';
import { PostDTO } from '@/shared/api/types';
import { useAuth } from '@/contexts/useAuth';
import HandshakeCard from '@/components/handshakes/HandshakeCard';
import Pill from '@/components/common/Pill';
import TextWithLinks from '../common/TextWithLinks';

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
        handshakes,
        tags = [],
        fake,
        showHandshakeShortcut = false
    } = props;

    const { user } = useAuth();
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);

    const hasImages = images && images.length > 0;
    const imageSrc = fake
        ? images?.[0]
        : images?.[0]
            ? getImagePath(images[0])
            : undefined;

    const viewerHandshake = getUserHandshake({ handshakes }, user?.id);

    return (
        <div className='border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition cursor-pointer'>
            {/* Header with title and status */}
            <div className='flex items-center gap-2 mb-3' onClick={() => navigate(`/post/${id}`)}>
                {status === 'closed' && (
                    <span className='bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded whitespace-nowrap'>
                        CLOSED
                    </span>
                )}
                <h2 className='text-lg font-bold break-words text-gray-800 dark:text-gray-100'>
                    {title}
                </h2>
            </div>

            {/* Sender info */}
            {sender && (
                <div className='mb-3' onClick={() => navigate(`/post/${id}`)}>
                    <UserCard user={sender} />
                </div>
            )}

            {/* Images section */}
            {hasImages && (
                <div className='mb-4' onClick={(e) => e.stopPropagation()}>
                    {images.length === 1 ? (
                        // Single image display
                        <div className='w-full flex justify-center'>
                            <img
                                src={fake ? imageSrc : getImagePath(images[0])}
                                alt={title}
                                className='max-h-64 w-auto rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity'
                                onError={() => setImgError(true)}
                                onClick={() => navigate(`/post/${id}`)}
                            />
                        </div>
                    ) : (
                        // Multiple images carousel
                        <ImageCarousel images={fake ? images : images} />
                    )}
                </div>
            )}

            {/* Tags */}
            <div className='mb-3' onClick={() => navigate(`/post/${id}`)}>
                <div className='flex flex-wrap gap-1'>
                    {tags.map((tag, i) => (
                        <Pill key={i} name={tag.name} size="sm" />
                    ))}
                </div>
            </div>

            {/* Body text */}
            <div className='mb-3' onClick={() => navigate(`/post/${id}`)}>
                <TextWithLinks className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 break-words">
                    {body}
                </TextWithLinks>
            </div>

            {/* Handshake shortcut */}
            {viewerHandshake && showHandshakeShortcut && (
                <div className='mt-4' onClick={(e) => e.stopPropagation()}>
                    <HandshakeCard
                        handshake={{
                            ...viewerHandshake,
                            post: props
                        }}
                        userID={user?.id}
                        showPostDetails={false}
                    />
                </div>
            )}
        </div>
    );
}
