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
        showHandshakeShortcut = false
    } = props;

    const { user } = useAuth();
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);

    const imageSrc = fake
        ? images?.[0]
        : images?.[0]
            ? getImagePath(images[0])
            : undefined;
    const showBodyInImageBox = imgError || !images?.length || !imageSrc;

    const viewerHandshake = getUserHandshake({ handshakes }, user?.id);

    return (
        <div
            className='border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition cursor-pointer'
            onClick={() => navigate(`/post/${id}`)}
        >
            <div className='flex justify-between items-start gap-4 w-full'>
                <div className='flex-1 pr-4 w-4/5'>
                    <div className='flex items-center justify-between gap-2 mb-2'>
                        <div className='flex items-center gap-2 min-w-0'>
                            {status === 'closed' && (
                                <span className='bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded whitespace-nowrap'>
                                    CLOSED
                                </span>
                            )}
                            <h2 className='text-lg font-bold break-words text-gray-800 dark:text-gray-100 truncate'>
                                {title}
                            </h2>
                        </div>
                        <span className='text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap'>
                            {timeAgoLabel(createdAt as any)}
                        </span>
                    </div>

                    {sender && (
                        <div className='mb-2'>
                            <UserCard user={sender} />
                        </div>
                    )}
                    <div className='my-2'>
                        {tags.map((tag, i) => (
                            <Pill key={i} name={tag.name} />
                        ))}
                    </div>
                    <TextWithLinks className='text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mr-2 break-words'>
                        {body}
                    </TextWithLinks>
                </div>
                <div className='w-20 h-20 flex items-center justify-center mt-2'>
                    {showBodyInImageBox ? (
                        <div className='w-full h-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded flex items-center justify-center text-center p-2 overflow-hidden'>
                            {truncateBody(body)}
                        </div>
                    ) : (
                        <img
                            src={imageSrc}
                            alt={title}
                            className='w-20 h-20 object-cover rounded-lg'
                            onError={() => setImgError(true)}
                        />
                    )}
                </div>
            </div>
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
