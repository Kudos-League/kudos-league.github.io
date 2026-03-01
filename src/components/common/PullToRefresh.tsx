import React, { useRef, useState, useCallback } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface PullToRefreshProps {
    onRefresh: () => Promise<unknown>;
    children: React.ReactNode;
    className?: string;
}

const THRESHOLD = 80;
const MAX_PULL = 120;

export default function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const startY = useRef(0);
    const pulling = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isTouchDevice = 'ontouchstart' in globalThis;

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (refreshing) return;
        const el = containerRef.current;
        if (!el || el.scrollTop > 0) return;
        startY.current = e.touches[0].clientY;
        pulling.current = true;
    }, [refreshing]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!pulling.current || refreshing) return;
        const delta = e.touches[0].clientY - startY.current;
        if (delta <= 0) {
            setPullDistance(0);
            return;
        }
        // Apply resistance
        const distance = Math.min(delta * 0.5, MAX_PULL);
        setPullDistance(distance);
    }, [refreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (!pulling.current) return;
        pulling.current = false;

        if (pullDistance >= THRESHOLD) {
            setRefreshing(true);
            setPullDistance(THRESHOLD);
            try {
                await onRefresh();
            }
            finally {
                setRefreshing(false);
                setPullDistance(0);
            }
        }
        else {
            setPullDistance(0);
        }
    }, [pullDistance, onRefresh]);

    if (!isTouchDevice) {
        return <div className={className}>{children}</div>;
    }

    const progress = Math.min(pullDistance / THRESHOLD, 1);

    return (
        <div
            ref={containerRef}
            className={className}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull indicator */}
            <div
                className='flex items-center justify-center overflow-hidden transition-[height] duration-150'
                style={{ height: pullDistance > 0 ? pullDistance : 0 }}
            >
                <ArrowPathIcon
                    className={`w-6 h-6 text-brand-500 transition-transform duration-150 ${refreshing ? 'animate-spin' : ''}`}
                    style={{ transform: `rotate(${progress * 360}deg)`, opacity: progress }}
                />
            </div>
            {children}
        </div>
    );
}
