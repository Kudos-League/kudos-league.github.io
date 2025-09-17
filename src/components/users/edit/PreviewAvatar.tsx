import React from 'react';
import AvatarComponent from '../Avatar';
import type { UserDTO } from '@/shared/api/types';
import { getImagePath } from '@/shared/api/config';

function PreviewAvatar({
    previewUrl,
    targetUser
}: {
    previewUrl: string | null;
    targetUser: UserDTO;
}) {
    const avatar = previewUrl
        ? getImagePath(previewUrl)
        : getImagePath(targetUser.avatar);
    if (previewUrl) {
        return (
            <img
                src={avatar}
                alt={targetUser.username || 'User'}
                className='rounded-full object-cover'
                style={{ width: 100, height: 100 }}
            />
        );
    }
    return (
        <AvatarComponent
            avatar={avatar}
            username={targetUser.username}
            size={100}
        />
    );
}

export default React.memo(PreviewAvatar);
