import { getImagePath } from '@/shared/api/config';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import Button from './common/Button';

type Props = {
    images: string[];
    interval?: number;
    fullResolution?: boolean;
};

const ImageCarousel: React.FC<Props> = ({ images, interval = 5000, fullResolution = false }) => {
    const [failed, setFailed] = useState<Set<number>>(new Set());
    const [idx, setIdx] = useState(0);
    const [lastManualChange, setLastManualChange] = useState(0);

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

    const goRight = useCallback(() => {
        if (total === 0) return;
        setIdx((i) => (i + 1) % total);
        setLastManualChange(Date.now());
    }, [total]);

    const goLeft = useCallback(() => {
        if (total === 0) return;
        setIdx((i) => (i - 1 + total) % total);
        setLastManualChange(Date.now());
    }, [total]);

    const onImgError = useCallback((origIndex: number) => {
        setFailed((prev) => {
            const next = new Set(prev);
            next.add(origIndex);
            return next;
        });
    }, []);

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
        <div className={`relative w-full mx-auto mb-6 overflow-hidden ${fullResolution ? 'min-w-[320px]' : 'max-w-2xl h-60'}`}>
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
                        <div className='w-full h-full flex items-center justify-center'>
                            <img
                                src={getImagePath(src)}
                                alt={`Post Image ${i + 1}`}
                                className={fullResolution ? 'w-full h-auto object-contain rounded-lg' : 'max-h-60 w-auto h-full object-contain rounded-lg'}
                                onError={() => onImgError(orig)}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {total > 1 && (
                <>
                    <button
                        className='absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 text-gray-800 dark:text-gray-200 hover:scale-110'
                        onClick={goLeft}
                        aria-label='Previous image'
                    >
                        <ChevronLeftIcon className='w-6 h-6' />
                    </button>

                    <button
                        className='absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 text-gray-800 dark:text-gray-200 hover:scale-110'
                        onClick={goRight}
                        aria-label='Next image'
                    >
                        <ChevronRightIcon className='w-6 h-6' />
                    </button>

                    <div className='absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/40 px-2 py-1 rounded text-xs text-white'>
                        {idx + 1}/{total}
                    </div>
                </>
            )}
        </div>
    );
};

export default ImageCarousel;
