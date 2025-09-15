import { getImagePath } from '@/shared/api/config';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Button from './common/Button';

type Props = {
    images: string[];
    interval?: number;
};

const ImageCarousel: React.FC<Props> = ({ images, interval = 5000 }) => {
    const [failed, setFailed] = useState<Set<number>>(new Set());
    const [idx, setIdx] = useState(0);

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
        setIdx((i) => (i + 1) % total);
    }, [total]);

    useEffect(() => {
        const timer = setInterval(() => {
            goRight();
        }, interval);

        return () => clearInterval(timer);
    }, [interval, total]);

    if (total === 0) return null;

    const goLeft = useCallback(() => {
        setIdx((i) => (i - 1 + total) % total);
    }, [total]);

    const onImgError = useCallback(
        (origIndex: number) => {
            setFailed((prev) => {
                const next = new Set(prev);
                next.add(origIndex);
                return next;
            });
        },
        [setFailed]
    );

    const trackStyle = {
        width: `${total * 100}%`,
        transform: `translateX(-${idx * (100 / total)}%)`
    };

    return (
        <div className='relative w-full max-w-2xl mx-auto h-60 mb-6 overflow-hidden'>
            <div
                className='h-full flex transition-transform duration-300 ease-in-out'
                style={trackStyle}
            >
                {valid.map(({ src, orig }, i) => (
                    <div
                        key={`${orig}-${src}`}
                        className='h-full'
                        style={{ width: `${100 / total}%` }}
                    >
                        <div className='w-full h-full flex items-center justify-center'>
                            <img
                                src={getImagePath(src)}
                                alt={`Post Image ${i + 1}`}
                                className='max-h-60 w-auto h-full object-contain rounded-lg'
                                onError={() => onImgError(orig)}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {total > 1 && (
                <>
                    <Button
                        className='absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10'
                        variant='icon'
                        shape='circle'
                        onClick={goLeft}
                        aria-label='Previous image'
                    >
                        &#8592;
                    </Button>

                    <Button
                        className='absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10'
                        variant='icon'
                        shape='circle'
                        onClick={goRight}
                        aria-label='Next image'
                    >
                        &#8594;
                    </Button>

                    <div className='absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/40 px-2 py-1 rounded text-xs text-white'>
                        {idx + 1}/{total}
                    </div>
                </>
            )}
        </div>
    );
};

export default ImageCarousel;
