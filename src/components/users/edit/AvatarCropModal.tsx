import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
            canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9);
        };
        image.onerror = reject;
        image.src = imageSrc;
    });
}

interface Props {
    src: string;
    onComplete: (croppedBlob: Blob) => void;
    onCancel: () => void;
}

const AvatarCropModal: React.FC<Props> = ({ src, onComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleApply = useCallback(async () => {
        if (!croppedAreaPixels) {
            return;
        }
        setIsProcessing(true);
        try {
            const blob = await getCroppedImg(src, croppedAreaPixels);
            onComplete(blob);
        }
        finally {
            setIsProcessing(false);
        }
    }, [croppedAreaPixels, src, onComplete]);

    return (
        <div className='fixed inset-0 bg-black/80 z-50 flex flex-col'>
            <div className='relative' style={{ height: '65vh' }}>
                <Cropper
                    image={src}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape='round'
                    showGrid={false}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                />
            </div>

            <div className='bg-black/50 px-4 py-3 mt-2 flex items-center gap-4'>
                <label className='text-sm text-white whitespace-nowrap'>Zoom</label>
                <input
                    type='range'
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className='flex-1'
                />
                <div className='flex gap-2 flex-shrink-0'>
                    <button
                        onClick={onCancel}
                        disabled={isProcessing}
                        className='px-3 py-1.5 rounded text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-50'
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={isProcessing}
                        className='px-3 py-1.5 bg-indigo-600 text-sm text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50'
                    >
                        {isProcessing ? 'Processing...' : 'Apply'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarCropModal;
