import React, { useEffect, useState, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import Input from '@/components/forms/Input';
import MapDisplay from '@/components/Map';
import GiftType from './GiftType';
import TagInput from '@/components/TagInput';
import Login from '@/components/login/Login';
import { getCategories } from '@/shared/api/actions';
import { CategoryDTO, LocationDTO } from '@/shared/api/types';

type FormValues = {
    title: string;
    body: string;
    type: 'gift' | 'request';
    files?: File[];
    tags: string[];
    categoryID: number;
};

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_COUNT = 5;

const badwords = ['badword', 'badword2', 'badword3'];

export default function CreatePost() {
    const form = useForm<FormValues>({ defaultValues: { tags: [], categoryID: 0 } });
    const { isLoggedIn, token } = useAuth();
    const { addPost } = usePosts();
    const navigate = useNavigate();

    const [postType, setPostType] = useState<'gift' | 'request'>('gift');
    const [giftType, setGiftType] = useState('Gift');
    const [location, setLocation] = useState<LocationDTO | null>(null);
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [serverError, setServerError] = useState<string | null>(null);
    const [badWordFlag, setBadWordFlag] = useState(false);
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        getCategories().then(setCategories).catch(console.error);
    }, []);

    const handleTagsChange = useCallback(
        (tags: { id: string; name: string }[]) => {
            const tagNames = tags.map((t) => t.name);
            form.setValue('tags', tagNames);
            const hasBad = tagNames.some((t) =>
                badwords.includes(t.toLowerCase().trim())
            );
            setBadWordFlag(hasBad);
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

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        if (!isLoggedIn) return setShowLoginForm(true);

        const fileError = validateFiles(data.files);
        if (fileError) return setServerError(fileError);

        const cleanedFiles = Array.isArray(data.files) ? data.files : [];
        const newPost = {
            title: data.title,
            body: data.body,
            type: postType,
            tags: data.tags,
            categoryID: data.categoryID,
            files: cleanedFiles,
            location
        };

        try {
            await addPost(newPost, token!).unwrap();
            form.reset();
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

    if (showLoginForm)
        return <Login onSuccess={() => setShowLoginForm(false)} />;

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

            {postType === 'gift' && (
                <GiftType selected={giftType} onSelect={setGiftType} />
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

            <Input
                name='files'
                label='Attach Images'
                form={form}
                type='file-image'
                multipleFiles
            />

            <TagInput
                initialTags={form.watch('tags')}
                onTagsChange={handleTagsChange}
            />
            {badWordFlag && (
                <p className='text-red-600 text-sm'>
                    Tag contains a blocked word.
                </p>
            )}

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
                Create Post
            </button>
        </div>
    );
}
