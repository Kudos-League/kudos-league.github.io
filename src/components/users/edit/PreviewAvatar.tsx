import React from 'react';
import AvatarComponent from '../Avatar';
import type { UserDTO } from '@/shared/api/types';

function PreviewAvatar({ previewUrl, targetUser }: { previewUrl: string | null; targetUser: UserDTO }) {
    if (previewUrl) {
        return (
            <img
                src={previewUrl}
                alt={targetUser.username || 'User'}
                className='rounded-full object-cover'
                style={{ width: 100, height: 100 }}
            />
        );
    }
    return (
        <AvatarComponent
            avatar={targetUser.avatar}
            username={targetUser.username}
            size={100}
        />
    );
}

export default React.memo(PreviewAvatar);
