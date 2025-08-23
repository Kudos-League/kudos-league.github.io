import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CategoryDTO, LocationDTO } from '@/shared/api/types';
import MapDisplay from '@/components/Map';
import { usePosts } from '@/hooks/usePosts';
import Input from '@/components/forms/Input';
import TagInput from '@/components/TagInput';
import { getCategories } from '@/shared/api/actions';
import { MAX_FILE_COUNT, MAX_FILE_SIZE_MB } from '@/shared/constants';
import { SubmitHandler, useForm } from 'react-hook-form';
import DropdownPicker from '@/components/forms/DropdownPicker';

/**
 * Form values for creating a new post.  The form collects title, body,
 * type (gift/request), optional image files, tags and category.
 */
type FormValues = {
    title: string;
    body: string;
    type: 'gift' | 'request';
    files?: File[];
    tags: string[];
    categoryID: number;
};

type Props = {
    setShowLoginForm: (show: boolean) => void;
};

/**
 * CreatePost presents a form for users to create new posts.  It has been
 * restyled to match the Planetaria‑inspired theme, featuring dark‑mode
 * support, teal accents, rounded controls and improved modals.
 */
export default function CreatePost({ setShowLoginForm }: Props) {
    const form = useForm<FormValues>({
        defaultValues: { tags: [], categoryID: 0 }
    });
    const { isLoggedIn, token } = useAuth();
    const { addPost } = usePosts();
    const navigate = useNavigate();
    const routerLocation = useLocation();
    const [showModal, setShowModal] = useState(false);
    const [postType, setPostType] = useState<'gift' | 'request'>('gift');
    const [location, setLocation] = useState<LocationDTO | null>(null);
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [serverError, setServerError] = useState<string | null>(null);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);

    // Fetch available categories on mount
    useEffect(() => {
        getCategories().then(setCategories).catch(console.error);
    }, []);

    // Sync selected images to the form state whenever they change
    useEffect(() => {
        form.setValue('files', selectedImages);
    }, [selectedImages, form]);

    /**
     * Convert tag objects into plain names before storing in form state.
     */
    const handleTagsChange = useCallback(
        (tags: { id: string; name: string }[]) => {
            const tagNames = tags.map((t) => t.name);
            form.setValue('tags', tagNames);
        },
        [form]
    );

    /**
     * Basic file validation for images: ensure count and size constraints.
     */
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

    /**
     * Handle image selection from the file input.  Selected images are stored
     * in state and validated against the constraints.
     */
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        const newFiles = Array.from(files);
        const updatedImages = [...selectedImages, ...newFiles];
        const fileError = validateFiles(updatedImages);
        if (fileError) {
            setServerError(fileError);
            return;
        }
        setSelectedImages(updatedImages);
        setServerError(null);
        // Reset the input so the same file can be re‑selected if needed
        event.target.value = '';
    };

    /**
     * Remove an image by its index from the selected images array.
     */
    const removeImage = (indexToRemove: number) => {
        setSelectedImages((prev) =>
            prev.filter((_, index) => index !== indexToRemove)
        );
    };

    /**
     * Create a temporary URL for previewing an image in the UI.
     */
    const createImagePreview = (file: File) => {
        return URL.createObjectURL(file);
    };

    /**
     * Submit the form to create a new post.  Performs validation and calls
     * the addPost hook.  If the user is not logged in the login form is shown.
     */
    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        if (!isLoggedIn) return setShowLoginForm(true);
        const fileError = validateFiles(selectedImages);
        if (fileError) return setServerError(fileError);
        setLocation((routerLocation.state as LocationDTO) || null);
        const newPost = {
            title: data.title,
            body: data.body,
            type: postType,
            tags: data.tags,
            categoryID: data.categoryID,
            files: selectedImages,
            location
        };
        try {
            await addPost(newPost, token).unwrap();
            form.reset();
            setSelectedImages([]);
            navigate('/feed');
        }
        catch (err: any) {
            if (err?.response?.status === 413) {
                setServerError('Files are too large.');
            }
            else {
                setServerError('Failed to create post.');
            }
        }
    };

    return (
        <div className='max-w-3xl mx-auto p-6 space-y-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow'>
            {/* Post type toggle and info button */}
            <div className='flex gap-3'>
                <button
                    className={`px-4 py-2 rounded transition ${
                        postType === 'gift'
                            ? 'bg-teal-600 text-white dark:bg-teal-700'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}
                    onClick={() => setPostType('gift')}
                >
                    Give stuff
                </button>
                <button
                    className={`px-4 py-2 rounded transition ${
                        postType === 'request'
                            ? 'bg-teal-600 text-white dark:bg-teal-700'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}
                    onClick={() => setPostType('request')}
                >
                    Request stuff
                </button>
                <button
                    onClick={() => setShowModal(true)}
                    className='text-teal-600 dark:text-teal-400 underline ml-auto'
                >
                    ℹ️ Info
                </button>
            </div>

            {/* Info modal */}
            {showModal && (
                <div className='fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center'>
                    <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-w-md w-full'>
                        <p className='text-gray-800 dark:text-gray-200'>
                            Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit. Curabitur et mi risus...
                        </p>
                        <button
                            onClick={() => setShowModal(false)}
                            className='mt-4 px-4 py-2 bg-teal-600 dark:bg-teal-700 text-white rounded hover:bg-teal-700 dark:hover:bg-teal-600 transition'
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Title input */}
            <Input
                name='title'
                label='Title *'
                form={form}
                registerOptions={{ required: true }}
            />
            {/* Body input */}
            <Input
                name='body'
                label='Info *'
                form={form}
                registerOptions={{ required: true }}
                multiline
            />

            <label className='block text-sm font-semibold mt-2 text-gray-800 dark:text-gray-200'>
                Category
            </label>
            <DropdownPicker
                options={categories.map((cat) => ({
                    label: cat.name,
                    value: String(cat.id)
                }))}
                value={String(form.watch('categoryID') || '')}
                onChange={(val) =>
                    form.setValue('categoryID', parseInt(val), {
                        shouldValidate: true,
                        shouldDirty: true
                    })
                }
                placeholder='Select a category'
            />
            {form.formState.errors.categoryID && (
                <p className='text-red-600 text-sm mt-1'>
                    {form.formState.errors.categoryID.message}
                </p>
            )}

            {/* Image upload section */}
            <div>
                <label className='block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200'>
                    Attach Images ({selectedImages.length}/{MAX_FILE_COUNT})
                </label>
                <input
                    type='file'
                    accept='image/*'
                    multiple
                    onChange={handleImageUpload}
                    className='border border-gray-300 dark:border-gray-700 rounded-lg w-full px-3 py-2 mb-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    disabled={selectedImages.length >= MAX_FILE_COUNT}
                />
                {selectedImages.length > 0 && (
                    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                        {selectedImages.map((file, index) => (
                            <div key={index} className='relative group'>
                                <img
                                    src={createImagePreview(file)}
                                    alt={`Preview ${index + 1}`}
                                    className='w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600'
                                />
                                <button
                                    type='button'
                                    onClick={() => removeImage(index)}
                                    className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors'
                                    title='Remove image'
                                >
                                    ×
                                </button>
                                <div className='text-xs text-gray-500 dark:text-gray-400 mt-1 truncate'>
                                    {file.name}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tags */}
            <TagInput
                initialTags={form.watch('tags')}
                onTagsChange={handleTagsChange}
            />

            {/* Location */}
            <label className='block text-sm font-semibold mt-4 text-gray-800 dark:text-gray-200'>
                Location
            </label>
            <MapDisplay
                showAddressBar
                coordinates={undefined}
                height={300}
                shouldGetYourLocation
                onLocationChange={(data) => {
                    if (data)
                        setLocation({
                            regionID: data.placeID,
                            name: data.name
                        });
                }}
            />

            {serverError && (
                <p className='text-red-600 text-sm mt-2'>{serverError}</p>
            )}

            {/* Submit button */}
            <button
                onClick={form.handleSubmit(onSubmit)}
                className='mt-4 px-6 py-2 bg-teal-600 dark:bg-teal-700 text-white rounded hover:bg-teal-700 dark:hover:bg-teal-600 transition'
            >
                Create
            </button>
        </div>
    );
}
