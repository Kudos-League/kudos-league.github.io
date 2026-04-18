import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapDisplay from '@/components/Map';
import ImageCarousel from '@/components/Carousel';
import TagInput from '@/components/TagInput';
import { useAuth } from '@/contexts/useAuth';
import { useUpdatePost } from '@/shared/api/mutations/posts';
import { useCategories } from '@/shared/api/queries/categories';
import { MAX_FILE_COUNT, MAX_FILE_SIZE_MB } from '@/shared/constants';
import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { getImagePath } from '@/shared/api/config';

import type {
    PostDTO,
    LocationDTO,
    UpdatePostDTO,
    CategoryDTO,
    GiftType
} from '@/shared/api/types';
import { takeFilesFromInput } from '@/shared/takeFilesFromInput';
import { ensureJpegAll } from '@/shared/convertHeic';
import Button from '../common/Button';
import DropdownPicker from '@/components/forms/DropdownPicker';

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
    const { data: categories = [] } = useCategories();

    const [editData, setEditData] = useState({
        title: post.title,
        body: post.body,
        tags: post.tags?.map((tag) => tag.name) || [],
        location: post.location || (null as LocationDTO | null),
        type: post.type as 'gift' | 'request',
        giftType: (post.giftType || 'physical') as GiftType,
        categoryID: post.category?.id || (null as number | null)
    });
    const [showGiftTypeInfo, setShowGiftTypeInfo] = useState(false);
    const [editImages, setEditImages] = useState<File[]>([]);
    const [editImageError, setEditImageError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deletedImageIndices, setDeletedImageIndices] = useState<Set<number>>(
        new Set()
    );

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFiles = takeFilesFromInput(e.target);
        if (rawFiles.length === 0) return;
        const newFiles = await ensureJpegAll(rawFiles);
        const tooLarge = newFiles.find(
            (f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024
        );
        if (tooLarge) {
            setEditImageError(`"${tooLarge.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
            return;
        }
        const updated = [...editImages, ...newFiles];
        if (updated.length > MAX_FILE_COUNT) {
            setEditImageError(`You can only attach up to ${MAX_FILE_COUNT} images.`);
            return;
        }
        setEditImages(updated);
        setEditImageError(null);
    };

    const removeEditImage = (idx: number) => {
        setEditImages((prev) => prev.filter((_, i) => i !== idx));
        setEditImageError(null);
    };

    const removeExistingImage = (idx: number) => {
        setDeletedImageIndices((prev) => {
            const next = new Set(prev);
            next.add(idx);
            return next;
        });
        setEditImageError(null);
    };

    const createImagePreview = (f: File) => URL.createObjectURL(f);

    const handleTagsChange = (tags: { id: string; name: string }[]) => {
        const tagNames = tags.map((t) => t.name);
        setEditData({ ...editData, tags: tagNames });
    };

    const handleLocationChange = (data: any) => {
        if (data.coordinates) {
            const locationData: LocationDTO = {
                name:
                    data.name ||
                    data.businessName ||
                    data.formattedAddress ||
                    '',
                regionID: data.placeID,
                latitude: data.coordinates.latitude,
                longitude: data.coordinates.longitude
            };
            console.log(
                '[PostEditForm] Location changed:',
                data,
                'Extracted name:',
                locationData.name
            );
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
                tags: editData.tags,
                type: editData.type,
                giftType: editData.type === 'gift' ? editData.giftType : 'physical',
                categoryID: editData.categoryID
            };

            // Digital gifts are always global
            if (editData.type === 'gift' && editData.giftType === 'digital') {
                updateData.location = { regionID: null, global: true };
            }
            // Handle location changes (including deletion)
            else if (editData.location !== post.location) {
                updateData.location = editData.location;
                console.log('[PostEditForm] Location change detected:', {
                    oldLocation: post.location,
                    newLocation: editData.location
                });
            }

            // Send new files to upload
            if (editImages.length > 0) {
                updateData.files = editImages;
            }

            // Always send remaining images (with deleted ones filtered out)
            const remainingImages =
                post.images?.filter(
                    (_, idx) => !deletedImageIndices.has(idx)
                ) || [];
            updateData.images = remainingImages;

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
            const firstMsg = Array.isArray(err) ? (err as string[])[0] : (err instanceof Error ? err.message : null);
            if (firstMsg?.toLowerCase().includes('unsupported image format')) {
                setEditImageError('One or more images have an unsupported format. Please use JPEG, PNG, or WebP.');
            }
            else {
                setEditImageError(firstMsg || 'Failed to save changes');
            }
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
                <p className='text-red-500'>
                    You don&apos;t have permission to edit this post.
                </p>
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
                disabled={isSaving}
                className='mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
                aria-label='Go back'
            >
                <ArrowLeftIcon className='w-5 h-5' />
                <span className='font-medium'>Back</span>
            </button>

            {/* Edit Form */}
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg space-y-4 text-gray-900 dark:text-gray-100 w-full overflow-x-hidden box-border'>
                <h1 className='text-2xl font-bold mb-6'>Edit Post</h1>

                <div className='flex gap-3'>
                    <Button
                        variant={
                            editData.type === 'gift' ? 'primary' : 'secondary'
                        }
                        onClick={() => {
                            setEditData({
                                ...editData,
                                type: 'gift'
                            });
                            setEditImageError(null);
                        }}
                        disabled={isSaving}
                    >
                        Give stuff
                    </Button>
                    <Button
                        variant={
                            editData.type === 'request'
                                ? 'primary'
                                : 'secondary'
                        }
                        onClick={() => {
                            setEditData({
                                ...editData,
                                type: 'request',
                                giftType: 'physical'
                            });
                            setEditImageError(null);
                        }}
                        disabled={isSaving}
                    >
                        Request stuff
                    </Button>
                </div>

                {editData.type === 'gift' && (
                    <div className='flex items-center gap-3'>
                        <div className='flex rounded-full border border-gray-300 dark:border-gray-600 overflow-hidden'>
                            <button
                                type='button'
                                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                                    editData.giftType === 'physical'
                                        ? 'bg-brand-600 text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                onClick={() => setEditData({ ...editData, giftType: 'physical' })}
                                disabled={isSaving}
                            >
                                Physical
                            </button>
                            <button
                                type='button'
                                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                                    editData.giftType === 'digital'
                                        ? 'bg-brand-600 text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                onClick={() => setEditData({ ...editData, giftType: 'digital' })}
                                disabled={isSaving}
                            >
                                Digital
                            </button>
                        </div>
                        <div className='relative'>
                            <button
                                type='button'
                                onClick={() => setShowGiftTypeInfo(!showGiftTypeInfo)}
                                onMouseEnter={() => setShowGiftTypeInfo(true)}
                                onMouseLeave={() => setShowGiftTypeInfo(false)}
                                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                                aria-label='Gift type information'
                            >
                                <InformationCircleIcon className='w-5 h-5' />
                            </button>
                            {showGiftTypeInfo && (
                                <div className='absolute top-full right-0 mt-1 z-50 w-48 sm:w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg'>
                                    <p className='font-semibold mb-1'>Physical vs Digital</p>
                                    <p className='mb-1'><strong>Physical:</strong> A tangible item that requires coordination to hand off.</p>
                                    <p><strong>Digital:</strong> An online resource anyone can access. Users just give kudos.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div>
                    <label className='block text-sm font-medium mb-1'>
                        Category
                    </label>
                    <DropdownPicker
                        options={categories.map((c: CategoryDTO) => ({
                            label: c.name,
                            value: String(c.id)
                        }))}
                        value={
                            editData.categoryID !== null
                                ? String(editData.categoryID)
                                : ''
                        }
                        onChange={(val) => {
                            const parsed = val ? parseInt(val) : null;
                            setEditData({
                                ...editData,
                                categoryID: parsed
                            });
                        }}
                    />
                </div>

                <div className='w-full box-border'>
                    <label className='block text-sm font-medium mb-1'>
                        Title
                    </label>
                    <input
                        className='w-full box-border border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                        value={editData.title}
                        onChange={(e) =>
                            setEditData({
                                ...editData,
                                title: e.target.value
                            })
                        }
                        placeholder='Enter post title'
                        disabled={isSaving}
                    />
                </div>

                <div>
                    <label className='block text-sm font-medium mb-1'>
                        Description
                    </label>
                    <textarea
                        className='w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed'
                        style={{
                            WebkitOverflowScrolling: 'touch',
                            touchAction: 'pan-y'
                        }}
                        rows={4}
                        value={editData.body}
                        onChange={(e) =>
                            setEditData({
                                ...editData,
                                body: e.target.value
                            })
                        }
                        placeholder='Enter post description'
                        disabled={isSaving}
                    />
                </div>

                <div className='w-full overflow-hidden box-border'>
                    <TagInput
                        initialTags={editData.tags}
                        onTagsChange={handleTagsChange}
                    />
                </div>

                <div className={editData.type === 'gift' && editData.giftType === 'digital' ? 'relative' : ''}>
                    {editData.type === 'gift' && editData.giftType === 'digital' && (
                        <div className='absolute inset-0 z-10 bg-gray-200/60 dark:bg-gray-900/60 rounded-lg flex items-center justify-center pointer-events-auto cursor-not-allowed'>
                            <span className='bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full shadow font-medium'>
                                Digital gifts use global location
                            </span>
                        </div>
                    )}
                    <div className={editData.type === 'gift' && editData.giftType === 'digital' ? 'opacity-40 pointer-events-none' : ''}>
                        <label className='block text-sm font-medium mb-2'>
                            Location
                        </label>

                        {editData.location && (
                            <div className='mb-2 flex items-center justify-between gap-2'>
                                <div className='text-sm text-gray-700 dark:text-gray-300 truncate'>
                                    {editData.location.name || 'Location set'}
                                </div>
                                <Button
                                    type='button'
                                    variant='ghost'
                                    onClick={() =>
                                        setEditData({ ...editData, location: null })
                                    }
                                    className='!text-red-600 hover:!text-red-700 !text-sm flex-shrink-0'
                                    disabled={isSaving}
                                >
                                    ✕ Remove
                                </Button>
                            </div>
                        )}

                        <MapDisplay
                            key={editData.location?.regionID || 'no-location'}
                            edit
                            regionID={editData.location?.regionID || undefined}
                            coordinates={
                                editData.location
                                    ? {
                                        latitude: editData.location.latitude,
                                        longitude: editData.location.longitude,
                                        name: editData.location.name
                                    }
                                    : undefined
                            }
                            height={300}
                            exactLocation={isPostOwner}
                            onLocationChange={handleLocationChange}
                            shouldSavedLocationButton
                        />
                    </div>
                </div>

                <div className='w-full overflow-hidden box-border'>
                    <label className='block text-sm font-semibold mb-2'>
                        Images (
                        {(post.images?.length || 0) -
                            deletedImageIndices.size +
                            editImages.length}
                        /{MAX_FILE_COUNT})
                    </label>
                    {editImageError && (
                        <p className='text-sm text-red-600 dark:text-red-400 mb-2'>
                            {editImageError}
                        </p>
                    )}
                    <input
                        type='file'
                        accept='image/*'
                        multiple
                        onChange={handleImageUpload}
                        className='border border-gray-300 dark:border-gray-700 rounded-lg w-full box-border px-3 py-2 mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 truncate text-ellipsis overflow-hidden min-w-0 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-100 hover:file:bg-blue-100 dark:hover:file:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed'
                        disabled={
                            (post.images?.length || 0) -
                                deletedImageIndices.size +
                                editImages.length >=
                                MAX_FILE_COUNT || isSaving
                        }
                    />
                    {((post.images && post.images.length > 0) ||
                        editImages.length > 0) && (
                        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 pr-2'>
                            {/* Existing images from the post */}
                            {post.images?.map((url, index) => {
                                if (deletedImageIndices.has(index)) return null;
                                const imagePath = getImagePath(url);
                                if (!imagePath) return null;
                                return (
                                    <div
                                        key={`existing-${index}`}
                                        className='relative group'
                                    >
                                        <img
                                            src={imagePath}
                                            alt={`Image ${index + 1}`}
                                            className='w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600'
                                        />
                                        <Button
                                            type='button'
                                            shape='circle'
                                            variant='danger'
                                            onClick={() =>
                                                removeExistingImage(index)
                                            }
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
                                <div
                                    key={`new-${index}`}
                                    className='relative group'
                                >
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
