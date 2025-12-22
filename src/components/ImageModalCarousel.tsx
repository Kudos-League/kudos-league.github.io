import { getImagePath } from '@/shared/api/config';
import React, { useMemo, useState, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/solid';

type Props = {
    images: string[];
    initialIndex?: number;
    onClose: () => void;
};

const ImageModalCarousel: React.FC<Props> = ({ images, initialIndex = 0, onClose }) => {
    const [failed, setFailed] = useState<Set<number>>(new Set());
    const [idx, setIdx] = useState(initialIndex);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const valid = useMemo(() => {
        return images
            .map((src, orig) => ({ src, orig }))
            .filter(({ orig }) => !failed.has(orig));
    }, [images, failed]);

    const total = valid.length;

    const goRight = useCallback(() => {
        if (total === 0) return;
        setIdx((i) => (i + 1) % total);
    }, [total]);

    const goLeft = useCallback(() => {
        if (total === 0) return;
        setIdx((i) => (i - 1 + total) % total);
    }, [total]);

    const onImgError = useCallback((origIndex: number) => {
        setFailed((prev) => {
            const next = new Set(prev);
            next.add(origIndex);
            return next;
        });
    }, []);

    // Touch swipe handling
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

        if (isLeftSwipe) {
            goRight();
        }
        if (isRightSwipe) {
            goLeft();
        }
    };

    // Keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goRight();
            if (e.key === 'ArrowLeft') goLeft();
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goRight, goLeft, onClose]);

    if (total === 0) return null;

    const trackStyle = {
        width: `${total * 100}%`,
        transform: `translateX(-${idx * (100 / total)}%)`
    };

    return (
        <div className='fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4' onClick={onClose}>
            <div
                className='relative w-full h-full flex items-center justify-center max-w-6xl'
                onClick={(e) => e.stopPropagation()}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className='absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 hover:bg-black/90 transition-colors text-white shadow-lg border border-white/30'
                    aria-label='Close modal'
                    title='Close (Esc)'
                >
                    <XMarkIcon className='w-6 h-6' />
                </button>

                {/* Image Container */}
                <div className='relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg' onClick={(e) => e.stopPropagation()}>
                    {valid[idx] && (
                        <img
                            src={getImagePath(valid[idx].src)}
                            alt={`Post Image ${idx + 1}`}
                            className='max-w-full max-h-[90vh] object-contain'
                            onError={() => onImgError(valid[idx].orig)}
                        />
                    )}
                </div>

                {total > 1 && (
                    <>
                        {/* Left Button */}
                        <button
                            onClick={goLeft}
                            className='absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/70 hover:bg-black/90 transition-colors text-white shadow-lg border border-white/30'
                            aria-label='Previous image'
                            title='Previous (←)'
                        >
                            <ChevronLeftIcon className='w-7 h-7' />
                        </button>

                        {/* Right Button */}
                        <button
                            onClick={goRight}
                            className='absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/70 hover:bg-black/90 transition-colors text-white shadow-lg border border-white/30'
                            aria-label='Next image'
                            title='Next (→)'
                        >
                            <ChevronRightIcon className='w-7 h-7' />
                        </button>

                        {/* Image Counter - Bottom Center */}
                        <div className='absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-black/70 border border-white/30 text-xs font-medium text-white shadow-lg'>
                            <span className='tabular-nums'>{idx + 1}</span>
                            <span className='mx-0.5 text-white/70'>/</span>
                            <span className='tabular-nums'>{total}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ImageModalCarousel;
