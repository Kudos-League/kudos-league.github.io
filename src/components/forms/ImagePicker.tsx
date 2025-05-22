import React, { useRef } from "react";

type ImagePickerProps = {
  onChange: (files: File[]) => void;
  placeholder?: string;
  selectedFiles?: File[];
  multiple?: boolean;
};

export default function ImagePicker({
  onChange,
  placeholder = "Choose Images",
  selectedFiles: selectedImages = [],
  multiple = true,
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    onChange(multiple ? files : [files[0]]);
  };

  const openImagePicker = () => fileInputRef.current?.click();

  return (
    <div className="my-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={openImagePicker}
        className="flex items-center justify-center w-24 h-24 bg-gray-100 rounded border border-dashed"
      >
        ➕
      </button>
      {selectedImages.length > 0 && (
        <p className="mt-2 text-sm text-gray-600">
          {selectedImages.map((file) => file.name).join(', ')}
        </p>
      )}
    </div>
  );
}
