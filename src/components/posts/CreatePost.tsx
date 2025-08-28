import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type {
    CategoryDTO,
    CreatePostDTO,
    LocationDTO
} from '@/shared/api/types';
import MapDisplay from '@/components/Map';
import Input from '@/components/forms/Input';
import TagInput from '@/components/TagInput';
import DropdownPicker from '@/components/forms/DropdownPicker';
import { MAX_FILE_COUNT, MAX_FILE_SIZE_MB } from '@/shared/constants';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useCategories } from '@/shared/api/queries/categories';
import { useCreatePost } from '@/shared/api/mutations/posts';

type FormValues = {
    title: string;
    body: string;
    type: 'gift' | 'request';
    files?: File[];
    tags: string[];
    categoryID: number;
};

type Props = { setShowLoginForm: (show: boolean) => void };

export default function CreatePost({ setShowLoginForm }: Props) {
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const routerLocation = useLocation();

    const form = useForm<FormValues>({
        defaultValues: { tags: [], categoryID: 0, type: 'gift' }
    });

    const { data: categories = [], isLoading: catsLoading } = useCategories();
    const createPost = useCreatePost();

    const [postType, setPostType] = React.useState<'gift' | 'request'>('gift');
    const [location, setLocation] = React.useState<LocationDTO | null>(null);
    const [serverError, setServerError] = React.useState<string | null>(null);
    const [selectedImages, setSelectedImages] = React.useState<File[]>([]);

    React.useEffect(() => {
        form.setValue('type', postType);
    }, [postType, form]);

    React.useEffect(() => {
        form.setValue('files', selectedImages);
    }, [selectedImages, form]);

    React.useEffect(() => {
        const loc = routerLocation.state as LocationDTO | null;
        if (loc) setLocation(loc);
    }, [routerLocation.state]);

    const handleTagsChange = React.useCallback(
        (tags: { id: string; name: string }[]) => {
            form.setValue(
                'tags',
                tags.map((t) => t.name)
            );
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const updated = [...selectedImages, ...Array.from(files)];
        const fileError = validateFiles(updated);
        if (fileError) return setServerError(fileError);
        setSelectedImages(updated);
        setServerError(null);
        e.target.value = '';
    };

    const removeImage = (idx: number) => {
        setSelectedImages((prev) => prev.filter((_, i) => i !== idx));
    };

    const createImagePreview = (f: File) => URL.createObjectURL(f);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        if (!isLoggedIn) return setShowLoginForm(true);

        const fileError = validateFiles(selectedImages);
        if (fileError) return setServerError(fileError);

        const payload: CreatePostDTO = {
            title: data.title,
            body: data.body,
            type: postType,
            tags: data.tags,
            categoryID: data.categoryID,
            files: selectedImages,
            location
        };

        setServerError(null);

        try {
            await createPost.mutateAsync(payload);
            form.reset({
                title: '',
                body: '',
                tags: [],
                categoryID: 0,
                type: 'gift'
            });
            setSelectedImages([]);
            setLocation(null);
            setPostType('gift');
            navigate('/feed');
        }
        catch (errs: any) {
            const first = Array.isArray(errs) ? errs[0] : null;
            if (
                first?.includes('413') ||
                first?.toLowerCase().includes('too large')
            ) {
                setServerError('Files are too large.');
            }
            else {
                setServerError(first || 'Failed to create post.');
            }
        }
    };

    return (
        <div className='max-w-3xl mx-auto p-6 space-y-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow'>
            {/* Post type toggle */}
            <div className='flex gap-3'>
                <button
                    className={`px-4 py-2 rounded transition ${postType === 'gift' ? 'bg-teal-600 text-white dark:bg-teal-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}
                    onClick={() => setPostType('gift')}
                >
                    Give stuff
                </button>
                <button
                    className={`px-4 py-2 rounded transition ${postType === 'request' ? 'bg-teal-600 text-white dark:bg-teal-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}
                    onClick={() => setPostType('request')}
                >
                    Request stuff
                </button>
            </div>

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

            {/* Category */}
            <label className='block text-sm font-semibold mt-2 text-gray-800 dark:text-gray-200'>
                Category
            </label>
            <DropdownPicker
                options={(categories as CategoryDTO[]).map((c) => ({
                    label: c.name,
                    value: String(c.id)
                }))}
                value={String(form.watch('categoryID') || '')}
                onChange={(val) =>
                    form.setValue('categoryID', parseInt(val), {
                        shouldValidate: true,
                        shouldDirty: true
                    })
                }
                placeholder={catsLoading ? 'Loading…' : 'Select a category'}
            />
            {form.formState.errors.categoryID && (
                <p className='text-red-600 text-sm mt-1'>
                    {form.formState.errors.categoryID.message as any}
                </p>
            )}

            {/* Images */}
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

            <button
                onClick={form.handleSubmit(onSubmit)}
                className='mt-4 px-6 py-2 bg-teal-600 dark:bg-teal-700 text-white rounded hover:bg-teal-700 dark:hover:bg-teal-600 transition disabled:opacity-60'
                disabled={createPost.isPending}
            >
                {createPost.isPending ? 'Creating…' : 'Create'}
            </button>
        </div>
    );
}
