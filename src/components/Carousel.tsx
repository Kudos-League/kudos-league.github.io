import { getImagePath } from '@/shared/api/config';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

type Props = {
    images: string[];
    interval?: number;
    fullResolution?: boolean;
    variant?: 'postCard' | 'postDetails';
    onImageClick?: (index: number) => void;
};

const ImageCarousel: React.FC<Props> = ({ 
    images, 
    interval = 5000, 
    variant = 'postCard', 
    onImageClick 
}) => {
    const [failed, setFailed] = useState<Set<number>>(new Set());
    const [idx, setIdx] = useState(0);
    const [lastManualChange, setLastManualChange] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const valid = useMemo(() => {
        return images
            .map((src, orig) => ({ src, orig }))
            .filter(({ orig }) => !failed.has(orig));
    }, [images, failed]);

    const total = valid.length;

    // Reset index if it goes out of bounds after a failure
    useEffect(() => {
        if (total === 0) return;
        if (idx > total - 1) setIdx(total - 1);
    }, [total, idx]);

    const goRight = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
        if (total === 0) return;
        setIdx((i) => (i + 1) % total);
        setLastManualChange(Date.now());
        if (e && e.currentTarget instanceof HTMLElement) e.currentTarget.blur();
    }, [total]);

    const goLeft = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
        if (total === 0) return;
        setIdx((i) => (i - 1 + total) % total);
        setLastManualChange(Date.now());
        if (e && e.currentTarget instanceof HTMLElement) e.currentTarget.blur();
    }, [total]);

    const onImgError = useCallback((origIndex: number) => {
        setFailed((prev) => {
            const next = new Set(prev);
            next.add(origIndex);
            return next;
        });
    }, []);

    // Swipe Logic
    const minSwipeDistance = 50;
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };
    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };
    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > minSwipeDistance) goRight();
        if (distance < -minSwipeDistance) goLeft();
    };

    // Auto-play Logic
    useEffect(() => {
        if (total <= 1) return undefined;
        const timer = setInterval(() => {
            setIdx((i) => (i + 1) % total);
        }, interval);
        return () => clearInterval(timer);
    }, [interval, total, lastManualChange]);

    if (total === 0) return null;

    const isPostCard = variant === 'postCard';

    // Layout Logic
    const containerClass = isPostCard
        ? 'group relative h-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800'
        : 'group relative w-full mx-auto mb-6 overflow-hidden max-w-4xl h-[450px] bg-black rounded-xl';

    const trackStyle = {
        width: `${total * 100}%`,
        transform: `translateX(-${idx * (100 / total)}%)`
    };

    // Use flex-shrink-0 on slides to ensure they don't collapse in the track
    const slideClass = isPostCard 
        ? 'h-full flex-shrink-0' 
        : 'h-full flex-shrink-0 flex items-center justify-center overflow-hidden';

    const imgClass = isPostCard
        ? 'w-full h-full object-cover'
        : 'h-full w-auto object-contain'; // Pins to height, leaves space on sides

    const currentImageSrc = valid[idx]?.src;

    return (
        <div
            className={containerClass}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Blurred background for postDetails (Portrait images looks better with this) */}
            {!isPostCard && currentImageSrc && (
                <div
                    className='absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110 pointer-events-none'
                    style={{
                        backgroundImage: `url('${getImagePath(currentImageSrc)}')`
                    }}
                />
            )}

            <div
                className="flex transition-transform duration-500 ease-out h-full"
                style={trackStyle}
            >
                {valid.map(({ src, orig }, i) => (
                    <div
                        key={`${orig}-${src}`}
                        className={slideClass}
                        style={{ width: `${100 / total}%` }}
                    >
                        <img
                            src={getImagePath(src)}
                            alt={`Slide ${i + 1}`}
                            className={imgClass}
                            onError={() => onImgError(orig)}
                            onClick={() => onImageClick?.(orig)}
                            loading={i === 0 ? "eager" : "lazy"}
                        />
                    </div>
                ))}
            </div>

            {total > 1 && (
                <>
                    {/* Navigation Buttons */}
                    <button
                        className='absolute left-0 top-0 h-full w-12 md:left-3 md:top-1/2 md:-translate-y-1/2 md:w-10 md:h-10 bg-gradient-to-r from-black/30 to-transparent md:bg-white/90 md:dark:bg-gray-900/90 md:backdrop-blur-sm md:rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 text-white md:text-gray-800 md:dark:text-white shadow-lg'
                        onClick={goLeft}
                        aria-label='Previous'
                    >
                        <ChevronLeftIcon className='w-8 h-8 md:w-6 md:h-6' />
                    </button>

                    <button
                        className='absolute right-0 top-0 h-full w-12 md:right-3 md:top-1/2 md:-translate-y-1/2 md:w-10 md:h-10 bg-gradient-to-l from-black/30 to-transparent md:bg-white/90 md:dark:bg-gray-900/90 md:backdrop-blur-sm md:rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 text-white md:text-gray-800 md:dark:text-white shadow-lg'
                        onClick={goRight}
                        aria-label='Next'
                    >
                        <ChevronRightIcon className='w-8 h-8 md:w-6 md:h-6' />
                    </button>

                    {/* Pagination Indicator */}
                    <div className='absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white border border-white/20 tabular-nums'>
                        {idx + 1} / {total}
                    </div>

                    {/* User Prompt */}
                    {!isPostCard && (
                        <div className='absolute top-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider text-white/80 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity'>
                            Click to expand
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ImageCarousel;
