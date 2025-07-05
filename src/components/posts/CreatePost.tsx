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
}

export default function CreatePost({ setShowLoginForm }: Props) {
    const form = useForm<FormValues>({ defaultValues: { tags: [], categoryID: 0 } });

    const { isLoggedIn, token } = useAuth();
    const { addPost } = usePosts();
    const navigate = useNavigate();
    const routerLocation = useLocation();

    const [showModal, setShowModal] = useState(false);
    const [postType, setPostType] = useState<'gift' | 'request'>('gift');
    const [location, setLocation] = useState<LocationDTO | null>(null);
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [serverError, setServerError] = useState<string | null>(null);
    
    // New state for managing selected images
    const [selectedImages, setSelectedImages] = useState<File[]>([]);

    useEffect(() => {
        getCategories().then(setCategories).catch(console.error);
    }, []);

    // Update form when selectedImages changes
    useEffect(() => {
        form.setValue('files', selectedImages);
    }, [selectedImages, form]);

    const handleTagsChange = useCallback(
        (tags: { id: string; name: string }[]) => {
            const tagNames = tags.map((t) => t.name);
            form.setValue('tags', tagNames);
        },
        [form]
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

    // Handle adding new images
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const newFiles = Array.from(files);
        const updatedImages = [...selectedImages, ...newFiles];
        
        // Validate the total number of files
        const fileError = validateFiles(updatedImages);
        if (fileError) {
            setServerError(fileError);
            return;
        }

        setSelectedImages(updatedImages);
        setServerError(null);
        
        // Reset the input so the same file can be selected again if needed
        event.target.value = '';
    };

    // Handle removing an image
    const removeImage = (indexToRemove: number) => {
        setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // Create preview URL for an image
    const createImagePreview = (file: File) => {
        return URL.createObjectURL(file);
    };

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        if (!isLoggedIn) return setShowLoginForm(true);

        const fileError = validateFiles(selectedImages);
        if (fileError) return setServerError(fileError);

        setLocation(routerLocation.state as LocationDTO || null);
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
            setSelectedImages([]); // Clear selected images
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
        <div className='max-w-3xl mx-auto p-6 space-y-6'>
            <div className='flex gap-3'>
                <button
                    className={`px-4 py-2 rounded ${postType === 'gift' ? 'bg-black text-white' : 'bg-gray-200'}`}
                    onClick={() => setPostType('gift')}
                >
                    Give
                </button>
                <button
                    className={`px-4 py-2 rounded ${postType === 'request' ? 'bg-black text-white' : 'bg-gray-200'}`}
                    onClick={() => setPostType('request')}
                >
                    Request
                </button>
                <button
                    onClick={() => setShowModal(true)}
                    className='text-blue-600 underline ml-auto'
                >
                    ℹ️ Info
                </button>
            </div>

            {showModal && (
                <div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center'>
                    <div className='bg-white p-6 rounded shadow-lg max-w-md w-full'>
                        <p className='text-gray-800'>
                            Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit. Curabitur et mi risus...
                        </p>
                        <button
                            onClick={() => setShowModal(false)}
                            className='mt-4 px-4 py-2 bg-blue-600 text-white rounded'
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <Input
                name='title'
                label='Title *'
                form={form}
                registerOptions={{ required: true }}
            />
            <Input
                name='body'
                label='Info *'
                form={form}
                registerOptions={{ required: true }}
                multiline
            />

            <label className='block text-sm font-semibold mt-2'>Category</label>
            <select
                className='border rounded w-full px-3 py-2'
                {...form.register('categoryID', {
                    required: 'Please select a category',
                    valueAsNumber: true,
                    validate: value => value > 0 || 'Please select a valid category'
                })}
            >
                <option value=''>Select a category</option>
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                        {cat.name}
                    </option>
                ))}
            </select>

            {form.formState.errors.categoryID && (
                <p className='text-red-600 text-sm mt-1'>
                    {form.formState.errors.categoryID.message}
                </p>
            )}

            {/* Enhanced Image Upload Section */}
            <div>
                <label className='block text-sm font-semibold mb-2'>
                    Attach Images ({selectedImages.length}/{MAX_FILE_COUNT})
                </label>
                
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="border rounded w-full px-3 py-2 mb-4"
                    disabled={selectedImages.length >= MAX_FILE_COUNT}
                />

                {/* Display selected images with delete buttons */}
                {selectedImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {selectedImages.map((file, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={createImagePreview(file)}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-24 object-cover rounded border"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors"
                                    title="Remove image"
                                >
                                    ×
                                </button>
                                <div className="text-xs text-gray-500 mt-1 truncate">
                                    {file.name}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <TagInput
                initialTags={form.watch('tags')}
                onTagsChange={handleTagsChange}
            />

            <label className='block text-sm font-semibold mt-4'>Location</label>
            <MapDisplay
                showAddressBar
                coordinates={undefined}
                height={300}
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

            <button
                onClick={form.handleSubmit(onSubmit)}
                className='mt-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700'
            >
                Create
            </button>
        </div>
    )
}