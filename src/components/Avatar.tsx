import React from 'react';
import { getImagePath } from '@/shared/api/config';

export default function AvatarComponent({
    avatar,
    username,
    size = 48,
    onClick
}: {
    avatar: string | null | undefined;
    username: string | null;
    size?: number;
    onClick?: () => void;
}) {
    const url = avatar
        ? getImagePath(avatar)
        : 'https://via.placeholder.com/150';

    return (
        <img
            src={url}
            alt={username || 'User'}
            className='rounded-full object-cover'
            style={{ width: size, height: size }}
            onClick={onClick}
        />
    );
}
