import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { getImagePath } from '@/shared/api/config';

// Track loaded images globally to prevent re-flashing on re-renders
const loadedImages = new Set<string>();

export default function AvatarComponent({
    avatar,
    username,
    size = 48,
    pointer = true,
    onClick,
    className = ''
}: {
    avatar: string | null | undefined;
    username: string | null;
    size?: number;
    pointer?: boolean;
    onClick?: () => void;
    className?: string;
}) {
    const url = avatar ? getImagePath(avatar) : null;
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(
        url ? loadedImages.has(url) : false
    );
    const [showFallback, setShowFallback] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    const initial = username?.charAt(0)?.toUpperCase() || 'U';

    // Pre-check if image is already loaded (from cache or previous render)
    useEffect(() => {
        if (!url) {
            // No URL, show fallback after a delay
            const timer = setTimeout(() => setShowFallback(true), 300);
            return () => clearTimeout(timer);
        }

        // Check if already in our global cache
        if (loadedImages.has(url)) {
            setImageLoaded(true);
            setShowFallback(true);
            return;
        }

        // Check if the image is already cached by the browser
        if (imgRef.current?.complete && imgRef.current?.naturalHeight !== 0) {
            setImageLoaded(true);
            setShowFallback(true);
            loadedImages.add(url);
        }
        else {
            // Image not loaded yet, show fallback after a delay
            const timer = setTimeout(() => setShowFallback(true), 300);
            return () => clearTimeout(timer);
        }
    }, [url]);

    // If no avatar or image failed to load, render a letter-based fallback
    if (!avatar || imageError) {
        if (!showFallback) {
            // Don't show anything yet, just reserve the space
            return <div style={{ width: size, height: size }} />;
        }
        return (
            <div
                className={`rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-medium select-none cursor-pointer ${className}`}
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

    return (
        <div
            className='relative flex-shrink-0'
            style={{
                width: size,
                height: size,
                minWidth: size,
                minHeight: size
            }}
        >
            {/* Show fallback until image loads to prevent flicker */}
            {!imageLoaded && showFallback && (
                <div
                    className={`absolute inset-0 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-medium select-none ${className}`}
                    style={{
                        fontSize: Math.max(12, size * 0.4)
                    }}
                >
                    {initial}
                </div>
            )}
            <img
                ref={imgRef}
                src={url || undefined}
                alt={username || 'User'}
                className={`rounded-full object-cover ${className} ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
                style={{
                    width: size,
                    height: size,
                    minWidth: size,
                    minHeight: size,
                    cursor: pointer ? 'pointer' : 'default'
                }}
                onClick={onClick}
                onLoad={() => {
                    setImageLoaded(true);
                    setShowFallback(true);
                    if (url) loadedImages.add(url);
                }}
                onError={() => setImageError(true)}
            />
        </div>
    );
}
