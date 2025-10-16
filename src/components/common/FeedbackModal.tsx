import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Form from '@/components/forms/Form';
import FormField from '@/components/forms/FormField';
import Input from '@/components/forms/Input';
import DropdownPicker from '@/components/forms/DropdownPicker';
import TagInput from '@/components/TagInput';
import Button from './Button';
import Alert from './Alert';
import {
    BUG_REPORT_CATEGORIES,
    FEEDBACK_BASE_REWARD,
    MAX_FILE_COUNT,
    MAX_FILE_SIZE_MB,
    SITE_FEEDBACK_CATEGORIES
} from '@/shared/constants';
import { apiMutate } from '@/shared/api/apiClient';

import type { FeedbackKind } from '@/shared/api/types';

type FeedbackFormValues = {
    title: string;
    description: string;
    category: string;
    tags: string[];
};

type Props = {
    defaultType?: FeedbackKind;
    onSubmitted?: () => void;
};

const humanize = (value: string) =>
    value
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const toOptions = (list: readonly string[]) =>
    list.map((value) => ({ label: humanize(value), value }));

export default function FeedbackModal({ defaultType = 'site-feedback', onSubmitted }: Props) {
    const [activeType, setActiveType] = useState<FeedbackKind>(defaultType);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const form = useForm<FeedbackFormValues>({
        mode: 'onBlur',
        defaultValues: {
            title: '',
            description: '',
            category:
                defaultType === 'bug-report'
                    ? BUG_REPORT_CATEGORIES[0]
                    : SITE_FEEDBACK_CATEGORIES[0],
            tags: []
        }
    });

    const categoryOptions = useMemo(
        () =>
            activeType === 'bug-report'
                ? toOptions(BUG_REPORT_CATEGORIES)
                : toOptions(SITE_FEEDBACK_CATEGORIES),
        [activeType]
    );

    const previews = useMemo(
        () =>
            selectedImages.map((file) => ({
                file,
                url: URL.createObjectURL(file)
            })),
        [selectedImages]
    );

    useEffect(() => {
        return () => {
            previews.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [previews]);

    const resetForm = () => {
        form.reset({
            title: '',
            description: '',
            category:
                activeType === 'bug-report'
                    ? BUG_REPORT_CATEGORIES[0]
                    : SITE_FEEDBACK_CATEGORIES[0],
            tags: []
        });
        setSelectedImages([]);
    };

    const validateFiles = (files: File[]) => {
        if (files.length > MAX_FILE_COUNT) {
            return `You can upload up to ${MAX_FILE_COUNT} screenshots.`;
        }
        const tooLarge = files.find(
            (file) => file.size > MAX_FILE_SIZE_MB * 1024 * 1024
        );
        if (tooLarge) {
            return `Each image must be under ${MAX_FILE_SIZE_MB}MB.`;
        }
        return null;
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        const updated = [...selectedImages, ...Array.from(files)];
        const validation = validateFiles(updated);
        if (validation) {
            setServerError(validation);
            return;
        }
        setServerError(null);
        setSelectedImages(updated);
        event.target.value = '';
    };

    const removeImage = (index: number) => {
        setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (values: FeedbackFormValues) => {
        const validation = validateFiles(selectedImages);
        if (validation) {
            setServerError(validation);
            return;
        }

        setSubmitting(true);
        setServerError(null);
        setSuccess(false);
        try {
            await apiMutate('/feedback', 'post', {
                title: values.title,
                description: values.description,
                category: values.category,
                type: activeType,
                tags: values.tags,
                files: selectedImages
            }, { as: 'form' });

            setSuccess(true);
            resetForm();
            onSubmitted?.();
        }
        catch (err: any) {
            const message = Array.isArray(err)
                ? err.join(', ')
                : err?.message || 'Failed to submit feedback.';
            setServerError(message);
        }
        finally {
            setSubmitting(false);
        }
    };

    const switchType = (next: FeedbackKind) => {
        setActiveType(next);
        setSelectedImages([]);
        setServerError(null);
        setSuccess(false);
        const categories =
            next === 'bug-report' ? BUG_REPORT_CATEGORIES : SITE_FEEDBACK_CATEGORIES;
        form.setValue('category', categories[0]);
        form.setValue('tags', []);
    };

    return (
        <div className='w-full space-y-6'>
            <header className='space-y-2'>
                <h1 className='text-2xl font-semibold text-gray-900 dark:text-gray-100'>
                    Share Feedback
                </h1>
                <p className='text-sm text-gray-600 dark:text-gray-300'>
                    Submitting feedback grants you {FEEDBACK_BASE_REWARD} kudos automatically. Kudos league may award additional kudos for especially helpful reports.
                </p>
            </header>

            <div className='inline-flex rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 text-sm font-medium shadow-sm'>
                <button
                    type='button'
                    onClick={() => switchType('site-feedback')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                        activeType === 'site-feedback'
                            ? 'bg-teal-500 text-white'
                            : 'bg-transparent text-gray-700 dark:text-gray-200'
                    }`}
                >
                    Site feedback
                </button>
                <button
                    type='button'
                    onClick={() => switchType('bug-report')}
                    className={`ml-1 px-4 py-2 rounded-md transition-colors ${
                        activeType === 'bug-report'
                            ? 'bg-teal-500 text-white'
                            : 'bg-transparent text-gray-700 dark:text-gray-200'
                    }`}
                >
                    Bug report
                </button>
            </div>

            {success && (
                <Alert
                    type='success'
                    title='Thank you!'
                    message='We received your submission and the team will review it soon.'
                />
            )}
            {serverError && (
                <Alert type='danger' title='Unable to submit' message={serverError} />
            )}

            <Form methods={form} onSubmit={onSubmit} className='space-y-5'>
                <FormField name='title' label='Title *'>
                    <Input
                        name='title'
                        label=''
                        form={form}
                        registerOptions={{ required: 'Please add a title.' }}
                    />
                </FormField>

                <FormField name='description' label='Description *'>
                    <Input
                        name='description'
                        label=''
                        form={form}
                        multiline
                        registerOptions={{ required: 'Please describe the feedback.' }}
                    />
                </FormField>

                <FormField name='category' label='Category *'>
                    <Controller
                        control={form.control}
                        name='category'
                        rules={{ required: 'Choose a category.' }}
                        render={({ field }) => (
                            <DropdownPicker
                                options={categoryOptions}
                                value={field.value}
                                onChange={(next) => field.onChange(next)}
                                onBlur={field.onBlur}
                                placeholder='Select category'
                            />
                        )}
                    />
                </FormField>

                <TagInput
                    initialTags={form.watch('tags')}
                    onTagsChange={(tags) =>
                        form.setValue(
                            'tags',
                            tags.map((tag) => tag.name)
                        )
                    }
                />

                <div className='space-y-2'>
                    <label className='text-sm font-semibold text-gray-800 dark:text-gray-200 mr-1'>
                        Attach screenshots (optional)
                    </label>
                    <input
                        type='file'
                        accept='image/*'
                        multiple
                        onChange={handleImageUpload}
                        disabled={selectedImages.length >= MAX_FILE_COUNT}
                    />
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                        Up to {MAX_FILE_COUNT} images, each under {MAX_FILE_SIZE_MB}MB.
                    </p>

                    {previews.length > 0 && (
                        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
                            {previews.map((preview, index) => (
                                <div
                                    key={`${preview.file.name}-${index}`}
                                    className='relative overflow-hidden rounded-lg border border-gray-200 dark:border-zinc-700'
                                >
                                    <img
                                        src={preview.url}
                                        alt={preview.file.name}
                                        className='h-24 w-full object-cover'
                                    />
                                    <button
                                        type='button'
                                        className='absolute top-1 right-1 rounded-full bg-black/60 px-2 text-xs text-white'
                                        onClick={() => removeImage(index)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className='flex justify-end gap-2'>
                    <Button type='submit' variant='success' disabled={submitting}>
                        {submitting ? 'Submitting…' : 'Submit feedback'}
                    </Button>
                </div>
            </Form>
        </div>
    );
}
