import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import useLocation from '@/hooks/useLocation';
import AvatarComponent from '@/components/users/Avatar';
import Input from '@/components/forms/Input';
import MapDisplay from '@/components/Map';
// import ImagePicker from '@/components/forms/ImagePicker';
import { useAuth } from '@/hooks/useAuth';
import { updateUser } from '@/shared/api/actions';
// import { getImagePath } from '@/shared/api/config';

import type { ProfileFormValues, UserDTO } from '@/shared/api/types';
import TagInput from '@/components/TagInput';
import Alert from '@/components/common/Alert';
import Button from '../common/Button';

interface Props {
    targetUser: UserDTO;
    setTargetUser?: (user: UserDTO) => void;
    userSettings?: any;
    onClose: () => void;
}

const EditProfile: React.FC<Props> = ({
    targetUser,
    onClose,
    setTargetUser
}) => {
    const { user, token, updateUser: updateUserCache } = useAuth();

    const [loading, setLoading] = useState(false);
    const { setLocation } = useLocation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const [showImageOptions, setShowImageOptions] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const urlInputRef = useRef<HTMLInputElement>(null);

    const targetUserID = targetUser?.id;
    const form = useForm<ProfileFormValues>({
        defaultValues: {
            email: user.email,
            avatar: [],
            location: user.location || undefined,
            tags: user.tags.map((t) => t.name) || [],
            about: user.settings?.about || '',
            avatarURL: ''
        }
    });

    // Watch form values for reactive updates
    const watchedAvatar = form.watch('avatar');
    const watchedAvatarURL = form.watch('avatarURL');

    // Update preview when form values change
    useEffect(() => {
        // Priority: uploaded file > URL input > original avatar
        if (watchedAvatar && watchedAvatar.length > 0) {
            const file = watchedAvatar[0];
            if (file instanceof File) {
                const objectUrl = URL.createObjectURL(file);
                setPreviewUrl(objectUrl);
                return () => URL.revokeObjectURL(objectUrl);
            }
        }

        if (watchedAvatarURL && watchedAvatarURL.trim()) {
            setPreviewUrl(watchedAvatarURL.trim());
            return;
        }

        // Use original avatar
        setPreviewUrl(null);
    }, [watchedAvatar, watchedAvatarURL]);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            form.setValue('avatar', [files[0]]);
            form.setValue('avatarURL', '');
            setShowImageOptions(false);
        }
    };

    const handleURLSubmit = () => {
        const url = urlInputRef.current?.value?.trim();
        if (url) {
            form.setValue('avatarURL', url);
            form.setValue('avatar', []);
            setShowImageOptions(false);
            if (urlInputRef.current) {
                urlInputRef.current.value = '';
            }
        }
    };

    const clearImage = () => {
        form.setValue('avatar', []);
        form.setValue('avatarURL', '');
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (urlInputRef.current) {
            urlInputRef.current.value = '';
        }
        setShowImageOptions(false);
    };

    // Custom Avatar component that handles preview properly
    const PreviewAvatar = () => {
        if (previewUrl) {
            // For preview, use the URL directly without getImagePath transformation
            return (
                <img
                    src={previewUrl}
                    alt={targetUser.username || 'User'}
                    className='rounded-full object-cover'
                    style={{ width: 100, height: 100 }}
                />
            );
        }
        // Use the original AvatarComponent for the default avatar
        return (
            <AvatarComponent
                avatar={targetUser.avatar}
                username={targetUser.username}
                size={100}
            />
        );
    };

    const handleFormSubmit = async (data: any) => {
        setLoading(true);
        setToastMessage(null);
        setIsSubmitting(true);

        try {
            if (typeof data.tags === 'string') {
                data.tags = data.tags
                    .split(',')
                    .map((tag: string) => tag.trim())
                    .filter((tag: string) => tag.length > 0)
                    .map((tag: string) => ({ name: tag }));
            }
            else if (Array.isArray(data.tags)) {
                data.tags = data.tags
                    .map((tag: any) =>
                        typeof tag === 'string' ? { name: tag.trim() } : tag
                    )
                    .filter((tag: any) => tag?.name?.length > 0);
            }

            if (!data.avatar?.length && data.avatarURL?.trim()) {
                data.avatar = [data.avatarURL.trim()];
            }

            if (data.avatar?.[0] instanceof File) {
                delete data.avatarURL;
            }

            if (!data.about || data.about.trim() === '') {
                delete data.about;
            }

            if (Array.isArray(data.avatar) && data.avatar.length > 0) {
                data.avatar = data.avatar[0];
            }

            if (!data.avatar) {
                delete data.avatar;
            }
            if (
                !data.avatarURL ||
                typeof data.avatarURL !== 'string' ||
                data.avatarURL.trim() === ''
            ) {
                delete data.avatarURL;
            }

            if (!data.location?.changed) {
                delete data.location;
            }
            else delete data.location.changed;

            console.log('sending data', data);

            try {
                const updatedUser = await updateUser(
                    data,
                    targetUserID.toString(),
                    token
                );
                updateUserCache(updatedUser);
                setTargetUser?.(updatedUser);
                onClose();
                window.location.reload();
            }
            finally {
                setLoading(false);
            }
        }
        catch (err: any) {
            const str =
                err.response?.data?.errors?.[0]?.message ||
                err.response?.data?.message ||
                err.message ||
                'Update failed';

            console.error('Profile update failed', err);
            setToastMessage(str);
            setToastType('error');
        }
        finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className='max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6'>
                {/* Header */}
                <div className='flex justify-between items-center mb-6'>
                    <h2 className='text-2xl font-bold'>Edit Profile</h2>
                    <button
                        onClick={onClose}
                        className='text-sm text-blue-600 hover:underline'
                    >
                        ← Back to Profile
                    </button>
                </div>

                {toastMessage && (
                    <Alert
                        type={toastType === 'success' ? 'success' : 'danger'}
                        title={
                            toastType === 'success' ? 'Notification' : undefined
                        }
                        message={toastMessage}
                        show={!!toastMessage}
                        onClose={() => setToastMessage(null)}
                    />
                )}

                {/* Avatar Section with Edit Functionality */}
                <div className='flex flex-col items-center mb-6'>
                    <div className='relative group'>
                        <PreviewAvatar />

                        {/* Edit Icon Overlay */}
                        <Button
                            variant='icon'
                            shape='circle'
                            onClick={() =>
                                setShowImageOptions(!showImageOptions)
                            }
                            className='absolute bottom-0 right-0 p-2 shadow-lg w-8 h-8'
                            title='Change profile picture'
                        >
                            <svg
                                className='w-4 h-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
                                />
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M15 13a3 3 0 11-6 0 3 3 0 016 0z'
                                />
                            </svg>
                        </Button>

                        {/* Image Upload Options Dropdown */}
                        {showImageOptions && (
                            <div className='absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-[280px]'>
                                <div className='space-y-3'>
                                    <h4 className='font-semibold text-gray-800'>
                                        Change Profile Picture
                                    </h4>

                                    {/* File Upload Option */}
                                    <div>
                                        <input
                                            ref={fileInputRef}
                                            type='file'
                                            accept='image/*'
                                            onChange={handleFileSelect}
                                            className='hidden'
                                            id='avatar-file-input'
                                        />
                                        <label
                                            htmlFor='avatar-file-input'
                                            className='block w-full text-center bg-blue-50 text-blue-700 border border-blue-200 rounded px-3 py-2 cursor-pointer hover:bg-blue-100 transition-colors'
                                        >
                                            📁 Upload Image
                                        </label>
                                    </div>

                                    {/* URL Input Option */}
                                    <div>
                                        <div className='flex gap-2'>
                                            <input
                                                ref={urlInputRef}
                                                type='text'
                                                placeholder='Paste image URL...'
                                                className='flex-1 border border-gray-300 rounded px-3 py-2 text-sm'
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleURLSubmit();
                                                    }
                                                }}
                                            />
                                            <Button
                                                onClick={handleURLSubmit}
                                                className='text-sm'
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className='flex gap-2 pt-2 border-t'>
                                        {(watchedAvatar?.length > 0 ||
                                            watchedAvatarURL?.trim()) && (
                                            <button
                                                type='button'
                                                onClick={clearImage}
                                                className='text-xs text-red-600 hover:text-red-800'
                                            >
                                                Remove Image
                                            </button>
                                        )}
                                        <Button
                                            onClick={() =>
                                                setShowImageOptions(false)
                                            }
                                            className='text-xs ml-auto'
                                            variant='secondary'
                                        >
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className='text-xl font-semibold mt-2'>
                        {targetUser.username}
                    </p>
                    <p className='text-sm text-gray-500'>
                        {targetUser.kudos} Kudos
                    </p>
                    {(watchedAvatar?.length > 0 ||
                        watchedAvatarURL?.trim()) && (
                        <p className='text-xs text-green-600 mt-1'>
                            ✓ Image updated
                        </p>
                    )}
                </div>

                {feedbackMessage && (
                    <div className='text-green-700 text-center mb-4 font-semibold'>
                        {feedbackMessage}
                    </div>
                )}

                {/* Form Inputs - removed the separate profile picture section */}
                <div className='space-y-6'>
                    <div>
                        <label className='block font-semibold mb-1'>
                            Email
                        </label>
                        <Input
                            name='email'
                            form={form}
                            label='Email'
                            registerOptions={{ required: true }}
                            placeholder='Enter your email'
                        />
                    </div>

                    <div>
                        <label className='block font-semibold mb-1'>
                            Description
                        </label>
                        <Input
                            name='about'
                            form={form}
                            label=''
                            placeholder='Write a short bio...'
                            multiline
                        />
                        <p className='text-xs text-gray-500 italic'>
                            This will appear on your public profile.
                        </p>
                    </div>

                    <div>
                        <TagInput
                            initialTags={form.watch('tags')}
                            onTagsChange={(tags) => {
                                const tagNames = tags.map((t) => t.name);
                                form.setValue('tags', tagNames);
                            }}
                        />
                        <p className='text-xs text-gray-500 italic mt-2'>
                            These tags appear on your profile. You can use
                            interests, skills, or hobbies.
                        </p>
                    </div>

                    <div>
                        <label className='block font-semibold mb-1'>
                            Location
                        </label>
                        <MapDisplay
                            regionID={targetUser.location?.regionID}
                            width={400}
                            height={300}
                            showAddressBar
                            exactLocation
                            shouldGetYourLocation
                            onLocationChange={(data) => {
                                if (data.coordinates) {
                                    setLocation(data.coordinates);
                                    const obj = {
                                        ...data.coordinates,
                                        name: data.name,
                                        regionID: data.placeID
                                    };
                                    form.setValue('location', obj);
                                }
                            }}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className='flex gap-4 mt-4'>
                        <Button
                            onClick={form.handleSubmit(handleFormSubmit)}
                            disabled={loading || isSubmitting}
                            variant='success'
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button onClick={onClose} variant='secondary'>
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>

            {/* Click outside to close image options */}
            {showImageOptions && (
                <div
                    className='fixed inset-0 z-0'
                    onClick={() => setShowImageOptions(false)}
                />
            )}
        </>
    );
};

export default EditProfile;
