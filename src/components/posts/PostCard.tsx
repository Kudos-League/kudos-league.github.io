import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarComponent from '../Avatar';
import { getEndpointUrl } from 'shared/api/config';

type Props = {
    id: number;
    title: string;
    body: string;
    type: string;
    images?: string[];
    tags?: Array<{ id: string; name: string }>;
    sender?: {
        id: string;
        username: string;
        avatar?: string;
        kudos: number;
    };
    rewardOffer?: {
        kudosFinal: number;
    };
    fake?: boolean;
    onPress: () => void;
};

function truncateBody(body: string, max = 100) {
    if (body.length <= max) return body;
    return body.slice(0, max) + '…';
}

export default function PostCard({
    // id,
    title,
    body,
    // type,
    images,
    // tags,
    sender,
    // rewardOffer,
    fake,
    onPress
}: Props) {
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);

    const imageSrc = fake
        ? images?.[0]
        : images?.[0]
            ? getEndpointUrl() + images[0]
            : undefined;

    const handleUserClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (sender?.id) navigate(`/user/${sender.id}`);
    };

    const showBodyInImageBox = imgError || !images?.length || !imageSrc;

    return (
        <div
            onClick={onPress}
            className='flex justify-between items-start border rounded p-4 mb-4 bg-white shadow hover:shadow-md cursor-pointer transition'
        >
            <div className='flex-1 pr-4'>
                <h2 className='text-lg font-bold mb-2'>{title}</h2>

                {sender && (
                    <div
                        onClick={handleUserClick}
                        className='flex items-center gap-2 mb-2 cursor-pointer'
                    >
                        <AvatarComponent
                            avatar={sender.avatar}
                            username={sender.username}
                            size={32}
                        />
                        <div>
                            <p className='text-sm font-semibold text-gray-700'>
                                {sender.username}
                            </p>
                            <p className='text-xs text-gray-500'>
                                {sender.kudos} Kudos
                            </p>
                        </div>
                    </div>
                )}

                {!images?.length && (
                    <p className='text-sm text-gray-600 line-clamp-3'>{body}</p>
                )}
            </div>

            <div className='w-20 h-20 flex items-center justify-center'>
                {showBodyInImageBox ? (
                    <div className='w-full h-full bg-gray-100 text-xs text-gray-600 rounded flex items-center justify-center text-center p-2 overflow-hidden'>
                        {truncateBody(body, 100)}
                    </div>
                ) : (
                    <img
                        src={imageSrc}
                        alt={title}
                        className='w-20 h-20 object-cover rounded'
                        onError={() => setImgError(true)}
                    />
                )}
            </div>
        </div>
    );
}
