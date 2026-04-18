import React, { useRef } from 'react';
import Button from '../common/Button';
import { ensureJpegAll } from '@/shared/convertHeic';

type FilePickerProps = {
    onChange: (files: File[]) => void;
    placeholder?: string;
    selectedFiles?: File[];
    multiple?: boolean;
    style?: React.CSSProperties;
    type?: 'file' | 'file-image';
};

export default function FilePicker({
    onChange,
    placeholder = 'Choose Files',
    selectedFiles = [],
    multiple = true,
    type = 'file'
}: FilePickerProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const raw = Array.from(event.target.files || []);
        const files = type === 'file-image' ? await ensureJpegAll(raw) : raw;
        onChange(multiple ? files : [files[0]]);
    };

    const openFilePicker = () => fileInputRef.current?.click();

    if (type === 'file-image') {
        return (
            <div className='my-4'>
                <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    multiple={multiple}
                    hidden
                    onChange={handleFileChange}
                />
                <Button
                    type='button'
                    onClick={openFilePicker}
                    className='w-24 h-24 border-2 border-dashed border-gray-400 flex items-center justify-center rounded hover:border-brand-500'
                >
                    📷
                </Button>
                {selectedFiles.length > 0 && (
                    <div className='mt-2 space-y-1 text-sm text-gray-600'>
                        {selectedFiles.map((file, idx) => (
                            <p key={idx}>{file.name}</p>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className='my-4'>
            <input
                ref={fileInputRef}
                type='file'
                multiple={multiple}
                hidden
                onChange={handleFileChange}
            />
            <Button
                type='button'
                onClick={openFilePicker}
                className='px-4 py-2 bg-brand-600 text-white rounded'
            >
                {placeholder}
            </Button>
            {selectedFiles.length > 0 && (
                <p className='mt-2 text-sm text-gray-600'>
                    {selectedFiles.map((file) => file.name).join(', ')}
                </p>
            )}
        </div>
    );
}
