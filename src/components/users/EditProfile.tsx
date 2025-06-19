import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import useLocation from '@/hooks/useLocation';
import AvatarComponent from '@/components/users/Avatar';
import Input from '@/components/forms/Input';
import MapDisplay from '@/components/Map';
import ImagePicker from '@/components/forms/ImagePicker';
import Toast from '@/components/common/Toast';
import { useAuth } from '@/hooks/useAuth';
import { updateUser } from '@/shared/api/actions';

import type { ProfileFormValues, UserDTO } from '@/shared/api/types';
import TagInput from '../TagInput';

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
    const { location, setLocation } = useLocation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    const targetUserID = targetUser?.id;
    const form = useForm<ProfileFormValues>({
        defaultValues: {
            email: user.email,
            avatar: [],
            location: user.location || undefined,
            tags: user.tags.map(t => t.name) || [],
            about: user.settings?.about || '',
        }
    });

    const getAvatarUrl = () => {
        const avatarFileOrUrl = form.watch('avatar')?.[0];
        if (avatarFileOrUrl) {
            if (typeof avatarFileOrUrl === 'string') return avatarFileOrUrl;
            if (avatarFileOrUrl instanceof File)
                return URL.createObjectURL(avatarFileOrUrl);
        }
        if (form.watch('avatarURL')) return form.watch('avatarURL');
        return targetUser.avatar || null;
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
                    .map((tag: any) => typeof tag === 'string' ? { name: tag.trim() } : tag)
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
            if (!data.avatarURL || typeof data.avatarURL !== 'string' || data.avatarURL.trim() === '') {
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
                updateUserCache(updatedUser); // Update auth context user
                setTargetUser?.(updatedUser); // Update parent component (profile page)
                onClose(); // Navigate back to profile page
                window.location.reload(); // Reload to reflect changes
            }
            finally {
                setLoading(false);
            }
            // setFeedbackMessage('Profile updated');
            // setTimeout(() => setFeedbackMessage(null), 2000);
        }
        catch (err: any) {
            const str = err.response?.data?.errors?.[0]?.message || 
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

                <div className='flex flex-col items-center mb-4'>
                    <AvatarComponent
                        avatar={getAvatarUrl()}
                        username={targetUser.username}
                        size={100}
                    />
                    <p className='text-xl font-semibold mt-2'>
                        {targetUser.username}
                    </p>
                    <p className='text-sm text-gray-500'>
                        {targetUser.kudos} Kudos
                    </p>
                </div>

                {feedbackMessage && (
                    <div className='text-green-700 text-center mb-4 font-semibold'>
                        {feedbackMessage}
                    </div>
                )}

                {/* Form Inputs */}
                <div className='space-y-6'>
                    <div>
                        <label className='block font-semibold mb-1'>Email</label>
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
                            label='Description'
                            placeholder='Write a short bio...'
                            multiline
                        />
                        <p className='text-xs text-gray-500 italic'>
                        This will appear on your public profile.
                        </p>
                    </div>

                    <div>
                        <label className='block font-semibold mb-1'>Tags</label>
                        <TagInput
                            initialTags={form.watch('tags')}
                            onTagsChange={(tags) => {
                                const tagNames = tags.map((t) => t.name);
                                form.setValue('tags', tagNames);
                            }}
                        />
                        <p className='text-xs text-gray-500 italic'>
                            These tags appear on your profile. You can use interests, skills, or hobbies.
                        </p>
                    </div>

                    <div>
                        <label className='block font-semibold mb-1'>
                        Profile Picture URL
                        </label>
                        <Input
                            name='avatarURL'
                            form={form}
                            label='Profile Picture URL'
                            placeholder='Paste an image URL'
                        />
                        <p className='text-xs text-gray-500 mb-2'>
                        Or upload an image instead
                        </p>
                        <ImagePicker
                            name="avatar"
                            form={form}
                            placeholder="Upload avatar"
                            multiple={false}
                        />
                    </div>

                    <div>
                        <label className='block font-semibold mb-1'>Location</label>
                        <MapDisplay
                            regionID={targetUser.location?.regionID}
                            coordinates={location}
                            width={400}
                            height={300}
                            showAddressBar={true}
                            exactLocation={false}
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
                        <button
                            onClick={form.handleSubmit(handleFormSubmit)}
                            disabled={loading || isSubmitting}
                            className='bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700'
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            onClick={onClose}
                            className='border border-gray-300 px-4 py-2 rounded hover:bg-gray-100'
                        >
                        Cancel
                        </button>
                    </div>
                </div>
            </div>

            {toastMessage && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setToastMessage(null)}
                />
            )}
        </>
    );
};

export default EditProfile;
