import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapDisplay from '@/components/Map';
import ImageCarousel from '@/components/Carousel';
import TagInput from '@/components/TagInput';
import { useAuth } from '@/contexts/useAuth';
import {
    useUpdatePost
} from '@/shared/api/mutations/posts';
import { MAX_FILE_COUNT, MAX_FILE_SIZE_MB } from '@/shared/constants';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { getImagePath } from '@/shared/api/config';

import type {
    PostDTO,
    LocationDTO,
    UpdatePostDTO
} from '@/shared/api/types';
import Button from '../common/Button';

interface Props {
    post: PostDTO;
    setPostDetails: (post: PostDTO | ((prev: PostDTO) => PostDTO)) => void;
    fetchPostDetails: (id: number) => void;
}

export default function PostEditForm({
    post,
    setPostDetails,
    fetchPostDetails
}: Props) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const updatePostMut = useUpdatePost();

    const [editData, setEditData] = useState({
        title: post.title,
        body: post.body,
        tags: post.tags?.map((tag) => tag.name) || [],
        location: post.location || null as LocationDTO | null,
        itemsLimit:
            typeof post.itemsLimit === 'number' && post.itemsLimit > 0
                ? String(post.itemsLimit)
                : ''
    });
    const [editImages, setEditImages] = useState<File[]>([]);
    const [editImageError, setEditImageError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deletedImageIndices, setDeletedImageIndices] = useState<Set<number>>(new Set());

    const validateFiles = (files?: File[]) => {
        if (!files) return null;
        if (files.length > MAX_FILE_COUNT)
            return `Max ${MAX_FILE_COUNT} files allowed.`;
        const tooLarge = files.find(
            (f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024
        );
        if (tooLarge) return `Files must be under ${MAX_FILE_SIZE_MB}MB.`;
        return null;
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const updated = [...editImages, ...Array.from(files)];
        const fileError = validateFiles(updated);
        if (fileError) {
            setEditImageError(fileError);
            return;
        }
        setEditImages(updated);
        setEditImageError(null);
        e.target.value = '';
    };

    const removeEditImage = (idx: number) => {
        setEditImages((prev) => prev.filter((_, i) => i !== idx));
    };

    const removeExistingImage = (idx: number) => {
        setDeletedImageIndices((prev) => {
            const next = new Set(prev);
            next.add(idx);
            return next;
        });
    };

    const createImagePreview = (f: File) => URL.createObjectURL(f);

    const handleTagsChange = (tags: { id: string; name: string }[]) => {
        const tagNames = tags.map((t) => t.name);
        setEditData({ ...editData, tags: tagNames });
    };

    const handleLocationChange = (data: any) => {
        if (data.coordinates) {
            const locationData: LocationDTO = {
                name: data.name,
                regionID: data.placeID,
                latitude: data.coordinates.latitude,
                longitude: data.coordinates.longitude
            };
            setEditData({ ...editData, location: locationData });
        }
    };

    const handleSaveEdit = async () => {
        const fileError = validateFiles(editImages);
        if (fileError) {
            setEditImageError(fileError);
            return;
        }

        setIsSaving(true);

        try {
            const updateData: any = {
                title: editData.title,
                body: editData.body,
                tags: editData.tags
            };

            if (
                editData.location &&
                editData.location !== post.location
            ) {
                updateData.location = editData.location;
            }

            const limitStr = (editData.itemsLimit || '').trim();
            if (limitStr === '') updateData.itemsLimit = null;
            else if (/^\d+$/.test(limitStr)) updateData.itemsLimit = Math.max(1, parseInt(limitStr, 10));

            // Send new files to upload
            if (editImages.length > 0) {
                updateData.files = editImages;
            }

            // Send remaining images (with deleted ones filtered out)
            // Backend expects images as an array, but toFormData will wrap arrays of primitives in an array structure
            if (deletedImageIndices.size > 0) {
                const remainingImages = post.images?.filter((_, idx) => !deletedImageIndices.has(idx)) || [];
                updateData.images = remainingImages;
            }

            const updated = await updatePostMut.mutateAsync({
                id: post.id,
                data: updateData
            });
            setPostDetails({ ...post, ...updated });
            setEditImages([]);
            setEditImageError(null);
            setDeletedImageIndices(new Set());
            navigate(`/post/${post.id}`);
        }
        catch (err) {
            console.error('Failed to save changes', err);
            setEditImageError(err instanceof Error ? err.message : 'Failed to save changes');
        }
        finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };

    const isPostOwner = user?.id === post.sender?.id;

    if (!isPostOwner) {
        return (
            <div className='max-w-4xl mx-auto p-4 text-center mt-20'>
                <p className='text-red-500'>You don&apos;t have permission to edit this post.</p>
                <Button onClick={handleCancel} className='mt-4'>
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className='max-w-4xl mx-auto px-4 py-4 min-height-dvh w-full box-border'>
            {/* Back Button */}
            <button
                onClick={handleCancel}
                className='mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm'
                aria-label='Go back'
            >
                <ArrowLeftIcon className='w-5 h-5' />
                <span className='font-medium'>Back</span>
            </button>

            {/* Edit Form */}
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg space-y-4 text-gray-900 dark:text-gray-100 w-full overflow-x-hidden box-border'>
                <h1 className='text-2xl font-bold mb-6'>Edit Post</h1>

                <div className='w-full box-border'>
                    <label className='block text-sm font-medium mb-1'>
                        Title
                    </label>
                    <input
                        className='w-full box-border border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        value={editData.title}
                        onChange={(e) =>
                            setEditData({
                                ...editData,
                                title: e.target.value
                            })
                        }
                        placeholder='Enter post title'
                    />
                </div>

                <div>
                    <label className='block text-sm font-medium mb-1'>
                        Description
                    </label>
                    <textarea
                        className='w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto'
                        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
                        rows={4}
                        value={editData.body}
                        onChange={(e) =>
                            setEditData({
                                ...editData,
                                body: e.target.value
                            })
                        }
                        placeholder='Enter post description'
                    />
                </div>

                <div className='w-full overflow-hidden box-border'>
                    <TagInput
                        initialTags={editData.tags}
                        onTagsChange={handleTagsChange}
                    />
                </div>

                <div>
                    <label className='block text-sm font-medium mb-2'>
                        Location
                    </label>

                    <MapDisplay
                        edit
                        regionID={editData.location?.regionID}
                        height={300}
                        exactLocation={isPostOwner}
                        onLocationChange={handleLocationChange}
                        shouldSavedLocationButton={true}
                    />
                </div>

                <div>
                    <label className='block text-sm font-medium mb-1'>
                        Number of items (leave blank for unlimited)
                    </label>
                    <input
                        className='w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        inputMode='numeric'
                        pattern='[0-9]*'
                        placeholder='e.g., 1'
                        value={editData.itemsLimit}
                        onChange={(e) =>
                            setEditData({
                                ...editData,
                                itemsLimit: e.target.value.replace(/[^0-9]/g, '')
                            })
                        }
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                        Limits how many accepted/completed handshakes the post can have.
                    </p>
                </div>

                <div className='w-full overflow-hidden box-border'>
                    <label className='block text-sm font-semibold mb-2'>
                        Images ({(post.images?.length || 0) - deletedImageIndices.size + editImages.length}/{MAX_FILE_COUNT})
                    </label>
                    {editImageError && (
                        <p className='text-sm text-red-600 dark:text-red-400 mb-2'>{editImageError}</p>
                    )}
                    <input
                        type='file'
                        accept='image/*'
                        multiple
                        onChange={handleImageUpload}
                        className='border border-gray-300 dark:border-gray-700 rounded-lg w-full box-border px-3 py-2 mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 truncate text-ellipsis overflow-hidden min-w-0 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-100 hover:file:bg-blue-100 dark:hover:file:bg-blue-800'
                        disabled={((post.images?.length || 0) - deletedImageIndices.size + editImages.length) >= MAX_FILE_COUNT}
                    />
                    {((post.images && post.images.length > 0) || editImages.length > 0) && (
                        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 pr-2'>
                            {/* Existing images from the post */}
                            {post.images?.map((url, index) => {
                                if (deletedImageIndices.has(index)) return null;
                                const imagePath = getImagePath(url);
                                if (!imagePath) return null;
                                return (
                                    <div key={`existing-${index}`} className='relative group'>
                                        <img
                                            src={imagePath}
                                            alt={`Image ${index + 1}`}
                                            className='w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600'
                                        />
                                        <Button
                                            type='button'
                                            shape='circle'
                                            variant='danger'
                                            onClick={() => removeExistingImage(index)}
                                            className='absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-sm opacity-100 shadow-md'
                                            title='Remove image'
                                        >
                                            ×
                                        </Button>
                                        <div className='absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded'>
                                            Current
                                        </div>
                                    </div>
                                );
                            })}
                            {/* New images being added */}
                            {editImages.map((file, index) => (
                                <div key={`new-${index}`} className='relative group'>
                                    <img
                                        src={createImagePreview(file)}
                                        alt={`Preview ${index + 1}`}
                                        className='w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600'
                                    />
                                    <Button
                                        type='button'
                                        shape='circle'
                                        variant='danger'
                                        onClick={() => removeEditImage(index)}
                                        className='absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-sm opacity-100 shadow-md'
                                        title='Remove image'
                                    >
                                        ×
                                    </Button>
                                    <div className='absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded'>
                                        New
                                    </div>
                                    <div className='text-xs text-gray-500 dark:text-gray-400 mt-1 truncate'>
                                        {file.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className='flex gap-3 pt-4'>
                    <Button
                        variant='success'
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                        variant='secondary'
                        onClick={handleCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}
