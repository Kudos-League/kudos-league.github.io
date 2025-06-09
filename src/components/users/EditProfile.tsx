import React, { useState } from 'react';
import useLocation from '@/hooks/useLocation';
import AvatarComponent from './Avatar';
import Input from '../forms/Input';
import MapDisplay from '../Map';
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues, UserDTO } from '@/shared/api/types';
import ImagePicker from '../forms/ImagePicker';

interface Props {
    targetUser: UserDTO;
    userSettings?: any;
    form: UseFormReturn<ProfileFormValues>;
    onSubmit: (data: ProfileFormValues) => Promise<void>;
    onClose: () => void;
    loading: boolean;
    error: string | null;
}

const EditProfile: React.FC<Props> = ({
    form,
    targetUser,
    onClose,
    loading,
    onSubmit,
    error
}) => {
    const { location, setLocation } = useLocation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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
        try {
            setIsSubmitting(true);

            if (typeof data.tags === 'string') {
                data.tags = data.tags
                    .split(',')
                    .map((tag: string) => tag.trim())
                    .filter((tag: string) => tag.length > 0);
            }

            if (!data.avatar?.length && data.avatarURL?.trim()) {
                data.avatar = [data.avatarURL.trim()];
            }

            if (data.avatar?.[0] instanceof File) {
                delete data.avatarURL;
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

            await onSubmit(data);
            setFeedbackMessage('Profile updated');
            setTimeout(() => setFeedbackMessage(null), 2000);
        }
        catch (err: any) {
            const str = err.response.data.errors?.[0]?.message || err.response.data.message || err.message || 'Update failed';
            console.error('Profile update failed', err);
            setFeedbackMessage(str);
            setTimeout(() => setFeedbackMessage(null), 3000);
        }
        finally {
            setIsSubmitting(false);
        }
    };

    return (
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
                    <Input
                        name='tags'
                        form={form}
                        label='Tags'
                        placeholder='e.g., gardening, coding, climbing'
                    />
                    <p className='text-xs text-gray-500 italic'>
                        Separate tags with commas.
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

                {error && <p className='text-sm text-red-600'>{error}</p>}

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
    );
};

export default EditProfile;
