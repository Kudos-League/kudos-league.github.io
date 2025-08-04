import React, { useState } from 'react';
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
    const [imageError, setImageError] = useState(false);
    
    // If no avatar or image failed to load, render a letter-based fallback
    if (!avatar || imageError) {
        const initial = username?.charAt(0)?.toUpperCase() || 'U';
        
        return (
            <div
                className='rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-medium select-none'
                style={{ 
                    width: size, 
                    height: size,
                    fontSize: Math.max(12, size * 0.4), // Scale font size with avatar size
                    cursor: onClick ? 'pointer' : 'default'
                }}
                onClick={onClick}
                title={username || 'User'}
            >
                {initial}
            </div>
        );
    }

    const url = getImagePath(avatar);
    
    return (
        <img
            src={url || undefined}
            alt={username || 'User'}
            className='rounded-full object-cover'
            style={{ 
                width: size, 
                height: size,
                cursor: onClick ? 'pointer' : 'default'
            }}
            onClick={onClick}
            onError={() => setImageError(true)}
        />
    );
}
