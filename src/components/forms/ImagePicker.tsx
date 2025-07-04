import React, { useRef } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';

type ImagePickerProps = {
    form: UseFormReturn<any>;
    name: string;
    placeholder?: string;
    multiple?: boolean;
};

export default function ImagePicker({
    form,
    name,
    placeholder = 'Choose Images',
    multiple = true
}: ImagePickerProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const openImagePicker = () => fileInputRef.current?.click();

    return (
        <div className="my-4">
            <Controller
                control={form.control}
                name={name}
                defaultValue={[]}
                render={({ field }) => (
                    <>
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            multiple={multiple}
                            ref={fileInputRef}
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                field.onChange(multiple ? files : [files[0]]);
                            }}
                        />
                        <button
                            type="button"
                            onClick={openImagePicker}
                            className="flex items-center justify-center w-24 h-24 bg-gray-100 rounded border border-dashed text-2xl"
                            title={placeholder}
                            aria-label={placeholder}
                        >
                            ➕
                        </button>
                        {Array.isArray(field.value) && field.value.length > 0 && (
                            <p className="mt-2 text-sm text-gray-600">
                                {field.value.map((file: File) => file.name).join(', ')}
                            </p>
                        )}
                    </>
                )}
            />
        </div>
    );
}
