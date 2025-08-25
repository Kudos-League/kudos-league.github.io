import Button from '@/components/common/Button';
import React from 'react';

const AvatarMenu: React.FC<{
  open: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  urlInputRef: React.RefObject<HTMLInputElement>;
  watchedAvatar?: File[];
  watchedAvatarURL?: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onURLSubmit: () => void;
  onClear: () => void;
  onClose: () => void;
}> = ({
    open,
    fileInputRef,
    urlInputRef,
    watchedAvatar,
    watchedAvatarURL,
    onFileChange,
    onURLSubmit,
    onClear,
    onClose
}) =>
    !open ? null : (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg shadow-lg p-4 z-10">
            <div className="space-y-3">
                <p className="font-medium text-gray-900 dark:text-white">Change Profile Picture</p>

                {/* File Upload */}
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onFileChange}
                        className="hidden"
                        id="avatar-file-input"
                    />
                    <label
                        htmlFor="avatar-file-input"
                        className="block w-full text-center bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-3 py-2 cursor-pointer hover:bg-indigo-100 dark:bg-white/10 dark:text-white dark:border-white/10"
                    >
						📁 Upload Image
                    </label>
                </div>

                {/* URL input */}
                <div className="flex gap-2">
                    <input
                        ref={urlInputRef}
                        type="text"
                        placeholder="Paste image URL..."
                        className="flex-1 border border-gray-300 dark:border-white/10 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        onKeyDown={(e) => e.key === 'Enter' && onURLSubmit()}
                    />
                    <Button onClick={onURLSubmit} className="text-sm">
						Apply
                    </Button>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                    {(watchedAvatar?.length || (watchedAvatarURL || '').trim()) ? (
                        <button type="button" onClick={onClear} className="text-xs text-red-600 hover:text-red-700">
							Remove Image
                        </button>
                    ) : null}
                    <Button variant="secondary" className="text-xs ml-auto" onClick={onClose}>
						Close
                    </Button>
                </div>
            </div>
        </div>
    );

export default AvatarMenu;