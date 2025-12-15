import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import type {
    CategoryDTO,
    CreatePostDTO,
    LocationDTO
} from '@/shared/api/types';
import MapDisplay from '@/components/Map';
import Input from '@/components/forms/Input';
import TagInput from '@/components/TagInput';
import DropdownPicker from '@/components/forms/DropdownPicker';
import Form from '@/components/forms/Form';
import FormField from '@/components/forms/FormField';
import Button from '@/components/common/Button';
import Alert from '@/components/common/Alert';
import { MAX_FILE_COUNT, MAX_FILE_SIZE_MB } from '@/shared/constants';
import { SubmitHandler, useForm, Controller } from 'react-hook-form';
import { useCategories } from '@/shared/api/queries/categories';
import { useCreatePost } from '@/shared/api/mutations/posts';

type FormValues = {
    title: string;
    body: string;
    type: 'gift' | 'request';
    itemsLimit: number;
    files?: File[];
    tags: string[];
    categoryID: number | null;
};

type Props = { setShowLoginForm: (show: boolean) => void };

export default function CreatePost({ setShowLoginForm }: Props) {
    const { isLoggedIn, user } = useAuth();
    const navigate = useNavigate();
    const routerLocation = useLocation();

    const form = useForm<FormValues>({
        mode: 'onBlur',
        defaultValues: { 
            tags: [], 
            categoryID: null, 
            type: 'gift',
            itemsLimit: 1
        }
    });

    const { data: categories = [], isLoading: catsLoading } = useCategories();

    // Deduplicate categories by ID to prevent any duplicates from showing
    const uniqueCategories = React.useMemo(() => {
        const seen = new Set<number>();
        return categories.filter((cat) => {
            if (seen.has(cat.id)) return false;
            seen.add(cat.id);
            return true;
        });
    }, [categories]);

    const createPost = useCreatePost();

    const [postType, setPostType] = React.useState<'gift' | 'request'>('gift');
    const [location, setLocation] = React.useState<LocationDTO | null>(null);
    const [serverError, setServerError] = React.useState<string | null>(null);
    const [selectedImages, setSelectedImages] = React.useState<File[]>([]);
    const [toastMessage, setToastMessage] = React.useState<string | null>(null);
    const [toastType, setToastType] = React.useState<'success' | 'error'>('success');
    const [placeholder, setPlaceholder] = React.useState<string>('1');

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

    React.useEffect(() => {
        if (!toastMessage) return;
        const t = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(t);
    }, [toastMessage]);

    const handleTagsChange = React.useCallback(
        (tags: { id: string; name: string }[]) => {
            form.setValue(
                'tags',
                tags.map((t) => t.name)
            );
        },
        [form]
    );

    const handleUseProfileLocation = () => {
        if (user?.location) {
            setLocation({
                regionID: user.location.regionID || null,
                name: user.location.name || null
            });
        }
    };

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

    const validateQuantity = (value: number) => {
        if (!value || value < 1) return 'Quantity must be at least 1';
        if (value > 999) return 'Quantity cannot exceed 999';
        if (!Number.isInteger(value)) return 'Quantity must be a whole number';
        return true;
    };

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        if (!isLoggedIn) return setShowLoginForm(true);

        const fileError = validateFiles(selectedImages);
        if (fileError) return setServerError(fileError);

        const quantityValidation = validateQuantity(data.itemsLimit);
        if (quantityValidation !== true) {
            return setServerError(quantityValidation);
        }

        // Ensure all values are properly typed before sending to backend
        const payload: CreatePostDTO = {
            title: String(data.title || '').trim(),
            body: String(data.body || '').trim(),
            type: postType as 'gift' | 'request',
            itemsLimit: Number(data.itemsLimit),
            tags: data.tags.map(tag => String(tag).trim()),
            categoryID: Number(data.categoryID),
            files: selectedImages,
            location
        } as CreatePostDTO;

        setServerError(null);

        try {
            await createPost.mutateAsync(payload);
            form.reset({
                title: '',
                body: '',
                tags: [],
                categoryID: 0,
                type: 'gift',
                itemsLimit: 1
            });
            setSelectedImages([]);
            setLocation(null);
            setPostType('gift');
            setToastType('success');
            setToastMessage(`${postType === 'gift' ? 'Gift' : 'Request'} post created successfully!`);

            // Navigate after a short delay to allow toast to be visible
            setTimeout(() => {
                navigate('/feed');
            }, 1500);
        }
        catch (errs: any) {
            form.clearErrors();

            const first = Array.isArray(errs) ? errs[0] : null;
            const errorMessage = first || errs?.message || 'Failed to create post.';

            if (
                first?.includes('413') ||
                errorMessage.toLowerCase().includes('too large')
            ) {
                setServerError('Files are too large. Please reduce file size or number of files.');
            }
            else if (errorMessage.toLowerCase().includes('expected string')) {
                setServerError('Please enter valid text for title and description.');
            }
            else if (errorMessage.toLowerCase().includes('invalid characters')) {
                setServerError('Title or description contains invalid characters. Please remove < and > symbols.');
            }
            else if (errorMessage.toLowerCase().includes('title')) {
                setServerError(`Title error: ${errorMessage}`);
            }
            else if (errorMessage.toLowerCase().includes('body') || errorMessage.toLowerCase().includes('description')) {
                setServerError(`Description error: ${errorMessage}`);
            }
            else {
                setServerError(errorMessage);
            }
        }
    };

    return (
        <Form methods={form} onSubmit={onSubmit} className='max-w-3xl mx-auto p-6 space-y-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow' serverError={serverError}>
            <div className='flex gap-3'>
                <Button
                    variant={postType === 'gift' ? 'primary' : 'secondary'}
                    onClick={() => setPostType('gift')}
                >
                    Give stuff
                </Button>
                <Button
                    variant={postType === 'request' ? 'primary' : 'secondary'}
                    onClick={() => setPostType('request')}
                >
                    Request stuff
                </Button>
            </div>

            <FormField name='title' label='Title *'>
                <Input
                    name='title'
                    label=''
                    form={form}
                    valueTransformer={(v) => String(v || '')}
                    registerOptions={{
                        required: 'Title is required',
                        minLength: { value: 3, message: 'Title must be at least 3 characters' },
                        maxLength: { value: 60, message: 'Title cannot exceed 60 characters' },
                        validate: (value) => {
                            if (!value || typeof value !== 'string') {
                                return 'Please enter a valid title';
                            }
                            if (value.trim().length < 3) {
                                return 'Title must be at least 3 characters';
                            }
                            if (/<|>/.test(value)) {
                                return 'Title cannot contain < or > characters';
                            }
                            return true;
                        }
                    }}
                />
            </FormField>
            
            <FormField name='body' label='Description *'>
                <Input
                    name='body'
                    label=''
                    form={form}
                    valueTransformer={(v) => String(v || '')}
                    registerOptions={{
                        required: 'Description is required',
                        validate: (value) => {
                            if (!value || typeof value !== 'string') {
                                return 'Please enter a valid description';
                            }
                            if (value.trim().length === 0) {
                                return 'Description cannot be empty';
                            }
                            if (/<|>/.test(value)) {
                                return 'Description cannot contain < or > characters';
                            }
                            return true;
                        }
                    }}
                    multiline
                />
            </FormField>

            <FormField name='itemsLimit' label='Number of Items *' helper={`How many items are you ${postType === 'gift' ? 'giving away' : 'requesting'}?`}>
                <Input
                    name='itemsLimit'
                    label=''
                    form={form}
                    placeholder={placeholder}
                    htmlInputType='number'
                    valueTransformer={(v) => (v === '' ? '' : Number(v))}
                    onValueChange={(val) => {
                        if (val !== '') {
                            Number(val) < 1
                                ? form.setValue('itemsLimit', 1)
                                : form.setValue('itemsLimit', Number(val));
                        } 
                        else {
                            setPlaceholder('');
                        }
                    }}
                    registerOptions={{
                        required: 'Quantity is required',
                        min: { value: 1, message: 'Quantity must be at least 1' },
                        max: { value: 999, message: 'Quantity cannot exceed 999' },
                        validate: (v: any) => {
                            const num = Number(v);
                            if (!num || num < 1) return 'Quantity must be at least 1';
                            if (num > 999) return 'Quantity cannot exceed 999';
                            if (!Number.isInteger(num)) return 'Quantity must be a whole number';
                            return true;
                        }
                    }}
                />
            </FormField>

            <FormField
                name='categoryID'
                label='Category * (REQUIRED)'
                helper='⚠️ You must select a category before creating your post'
            >
                <Controller
                    control={form.control}
                    name='categoryID'
                    rules={{
                        required: 'Category is required - please select one from the dropdown',
                        // Validation now checks for a truthy value (any ID > 0)
                        validate: (v) => (v !== null) || 'Please select a category from the dropdown.'
                    }}
                    render={({ field }) => (
                        <DropdownPicker
                            options={(uniqueCategories as CategoryDTO[]).map((c) => ({
                                label: c.name,
                                value: String(c.id)
                            }))}
                            // Cast null to empty string for components that expect string/''
                            value={field.value !== null ? String(field.value) : ''} 
                            onChange={(val) => {
                                // If val is '', pass null to the form state
                                const parsed = val ? parseInt(val) : null; 
                                field.onChange(parsed);
                            }}
                            onBlur={field.onBlur}
                            placeholder={catsLoading ? 'Loading…' : '⚠️ Select a category (required)'}
                        />
                    )}
                />
            </FormField>

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
                                <Button
                                    type='button'
                                    shape='circle'
                                    variant='danger'
                                    onClick={() => removeImage(index)}
                                    className='absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-sm'
                                    title='Remove image'
                                >
                                    ×
                                </Button>
                                <div className='text-xs text-gray-500 dark:text-gray-400 mt-1 truncate'>
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

            <div>
                <label className='block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200'>
                    Location
                </label>

                <MapDisplay
                    edit
                    height={300}
                    shouldGetYourLocation={true}
                    regionID={location?.regionID}
                    onLocationChange={(data) => {
                        if (data)
                            setLocation({
                                regionID: data.placeID,
                                name: data.name
                            });
                    }}
                    shouldSavedLocationButton={true}
                />
            </div>

            <Button
                type='submit'
                className='mt-4'
                disabled={createPost.isPending}
            >
                {createPost.isPending ? 'Creating...' : 'Create'}
            </Button>

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
                    <Alert
                        type={toastType === 'success' ? 'success' : 'danger'}
                        title={toastType === 'success' ? 'Success' : 'Error'}
                        message={toastMessage}
                        show={!!toastMessage}
                        onClose={() => setToastMessage(null)}
                        closable={true}
                    />
                </div>
            )}
        </Form>
    );
}