import { getImagePath } from '@/shared/api/config';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

type Props = {
    images: string[];
    interval?: number;
    fullResolution?: boolean;
};

const ImageCarousel: React.FC<Props> = ({ images, interval = 5000, fullResolution = false }) => {
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

    useEffect(() => {
        if (total === 0) return;
        if (idx > total - 1) setIdx(total - 1);
    }, [total, idx]);

    const goRight = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (total === 0) return;
        setIdx((i) => (i + 1) % total);
        setLastManualChange(Date.now());
        e.currentTarget.blur();
    }, [total]);

    const goLeft = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (total === 0) return;
        setIdx((i) => (i - 1 + total) % total);
        setLastManualChange(Date.now());
        e.currentTarget.blur();
    }, [total]);

    const onImgError = useCallback((origIndex: number) => {
        setFailed((prev) => {
            const next = new Set(prev);
            next.add(origIndex);
            return next;
        });
    }, []);

    // Minimum swipe distance (in px)
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
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        const mockEvent = {
            currentTarget: {
                blur: () => {
                    // No-op for swipe gestures
                }
            }
        } as React.MouseEvent<HTMLButtonElement>;

        if (isLeftSwipe) {
            goRight(mockEvent);
        }
        if (isRightSwipe) {
            goLeft(mockEvent);
        }
    };

    useEffect(() => {
        if (total <= 1) return undefined;

        const timer = setInterval(() => {
            setIdx((i) => (i + 1) % total);
        }, interval);
        return () => clearInterval(timer);
    }, [interval, total, lastManualChange]);

    if (total === 0) return null;

    const trackStyle = {
        width: `${total * 100}%`,
        transform: `translateX(-${idx * (100 / total)}%)`
    };

    return (
        <div
            className={`group relative w-full mx-auto mb-6 overflow-hidden ${fullResolution ? '' : 'max-w-2xl h-60'}`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div
                className={`flex transition-transform duration-300 ease-in-out ${fullResolution ? 'w-full' : 'h-full'}`}
                style={trackStyle}
            >
                {valid.map(({ src, orig }, i) => (
                    <div
                        key={`${orig}-${src}`}
                        className={fullResolution ? 'w-full' : 'h-full'}
                        style={{ width: `${100 / total}%` }}
                    >
                        <div className='w-full h-full flex items-center justify-center overflow-hidden'>
                            <img
                                src={getImagePath(src)}
                                alt={`Post Image ${i + 1}`}
                                className={fullResolution ? 'max-w-full h-auto object-contain rounded-lg' : 'max-h-60 w-auto h-full object-contain rounded-lg'}
                                onError={() => onImgError(orig)}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {total > 1 && (
                <>
                    {/* Left navigation - desktop circular button, mobile gradient area */}
                    <button
                        className='absolute left-0 top-0 h-full w-16 md:left-3 md:top-1/2 md:-translate-y-1/2 md:w-12 md:h-12 bg-gradient-to-r from-black/20 to-transparent md:bg-white/80 md:dark:bg-gray-900/80 md:backdrop-blur-md hover:from-black/30 md:hover:bg-white md:dark:hover:bg-gray-900 md:rounded-full md:shadow-xl flex items-center justify-center md:justify-center transition-all duration-300 text-white md:text-gray-700 md:dark:text-gray-200 md:hover:scale-105 md:opacity-0 md:hover:opacity-100 md:group-hover:opacity-100 md:focus:opacity-100 md:border md:border-gray-200/50 md:dark:border-gray-700/50'
                        onClick={goLeft}
                        aria-label='Previous image'
                    >
                        <ChevronLeftIcon className='w-8 h-8 md:w-7 md:h-7 ml-2 md:ml-0' />
                    </button>

                    {/* Right navigation - desktop circular button, mobile gradient area */}
                    <button
                        className='absolute right-0 top-0 h-full w-16 md:right-3 md:top-1/2 md:-translate-y-1/2 md:w-12 md:h-12 bg-gradient-to-l from-black/20 to-transparent md:bg-white/80 md:dark:bg-gray-900/80 md:backdrop-blur-md hover:from-black/30 md:hover:bg-white md:dark:hover:bg-gray-900 md:rounded-full md:shadow-xl flex items-center justify-center md:justify-center transition-all duration-300 text-white md:text-gray-700 md:dark:text-gray-200 md:hover:scale-105 md:opacity-0 md:hover:opacity-100 md:group-hover:opacity-100 md:focus:opacity-100 md:border md:border-gray-200/50 md:dark:border-gray-700/50'
                        onClick={goRight}
                        aria-label='Next image'
                    >
                        <ChevronRightIcon className='w-8 h-8 md:w-7 md:h-7 mr-2 md:mr-0' />
                    </button>

                    {/* Image counter */}
                    <div className='absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 dark:bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-white shadow-lg border border-white/10'>
                        <span className='tabular-nums'>{idx + 1}</span>
                        <span className='mx-1 text-white/60'>/</span>
                        <span className='tabular-nums text-white/80'>{total}</span>
                    </div>
                </>
            )}
        </div>
    );
};

export default ImageCarousel;
