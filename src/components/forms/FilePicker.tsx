import React, { useRef } from 'react';

type FilePickerProps = {
  onChange: (files: File[]) => void;
  placeholder?: string;
  selectedFiles?: File[];
  multiple?: boolean;
  style?: React.CSSProperties;
  type?: 'text' | 'password' | 'file' | 'dropdown' | 'file-image';
};

export default function FilePicker({
  onChange,
  placeholder = 'Choose Files',
  selectedFiles = [],
  multiple = true,
  type = 'text',
}: FilePickerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    onChange(multiple ? files : [files[0]]);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <div className="my-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        hidden
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={openFilePicker}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {placeholder}
      </button>
      {selectedFiles.length > 0 && (
        <p className="mt-2 text-sm text-gray-600">
          {selectedFiles.map((file) => file.name).join(', ')}
        </p>
      )}
    </div>
  );
}
