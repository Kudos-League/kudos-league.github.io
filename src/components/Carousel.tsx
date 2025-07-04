import { getImagePath } from '@/shared/api/config';
import React, { useState, useMemo } from 'react';

type Props = {
    images: string[];
};

const ImageCarousel: React.FC<Props> = ({ images }) => {
    // Track images that failed to load
    const [failed, setFailed] = useState<Set<number>>(new Set());
    const [idx, setIdx] = useState(0);

    // Only keep non-failed images
    const validImages = useMemo(
        () => images.filter((_, i) => !failed.has(i)),
        [images, failed]
    );

    // Don't render if no images
    if (!validImages.length) return null;

    const total = validImages.length;
    const showIdx = Math.min(idx, total - 1);

    const goLeft = () => setIdx((i) => (i === 0 ? total - 1 : i - 1));
    const goRight = () => setIdx((i) => (i === total - 1 ? 0 : i + 1));

    const handleError = (failedIdx: number) => {
        setFailed((prev) => new Set(prev).add(images.indexOf(validImages[showIdx])));
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto flex items-center justify-center h-60 mb-6">
            {total > 1 && (
                <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-700 bg-opacity-60 hover:bg-opacity-90 text-white rounded-full p-2 z-10"
                    onClick={goLeft}
                    aria-label="Previous image"
                >
                    &#8592;
                </button>
            )}
            <div className="flex-1 flex items-center justify-center h-full">
                <img
                    src={getImagePath(validImages[showIdx])}
                    alt={`Post Image ${showIdx + 1}`}
                    className="object-cover rounded-lg max-h-60 max-w-full transition-all"
                    style={{ minWidth: 200 }}
                    onError={() => handleError(showIdx)}
                />
            </div>
            {total > 1 && (
                <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-700 bg-opacity-60 hover:bg-opacity-90 text-white rounded-full p-2 z-10"
                    onClick={goRight}
                    aria-label="Next image"
                >
                    &#8594;
                </button>
            )}
            {total > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-40 px-2 py-1 rounded text-xs text-white">
                    {showIdx + 1}/{total}
                </div>
            )}
        </div>
    );
};

export default ImageCarousel;
