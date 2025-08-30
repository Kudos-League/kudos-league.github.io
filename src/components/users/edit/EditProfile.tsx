import React, { useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import useLocation from '@/hooks/useLocation';
import { updateUser } from '@/shared/api/actions';

import Input from '@/components/forms/Input';
import MapDisplay from '@/components/Map';
import TagInput from '@/components/TagInput';
import Alert from '@/components/common/Alert';
import Button from '@/components/common/Button';
import deepEqual from '@/shared/deepEqual';
import computeChanged from './computeChanged';
import PreviewAvatar from './PreviewAvatar';
import SettingsSection from './SettingsSection';
import PageHeader from './PageHeader';
import FormField from './FormField';
import AvatarMenu from './AvatarMenu';
import ActionsBar from './ActionsBar';
import ErrorList from './ErrorList';

import type { ProfileFormValues, UserDTO } from '@/shared/api/types';
import { useAuth } from '@/contexts/useAuth';

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
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const [showImageOptions, setShowImageOptions] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const urlInputRef = useRef<HTMLInputElement>(null);
    const [logoutPassword, setLogoutPassword] = useState('');
    const [pwForm, setPwForm] = useState({
        current: '',
        next: '',
        confirm: ''
    });

    const targetUserID = targetUser?.id;
    
    // Function to get initial form values from targetUser
    const getInitialValues = (userData: UserDTO): ProfileFormValues => ({
        email: userData.email || '',
        avatar: [],
        location: userData.location || undefined,
        tags: userData.tags?.map((t) => t.name) || [],
        about: userData.settings?.about || '',
        avatarURL: ''
    });

    const form = useForm<ProfileFormValues>({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: getInitialValues(targetUser)
    });

    const { control, formState, reset } = form;
    const avatar = useWatch({ control, name: 'avatar' });
    const avatarURL = useWatch({ control, name: 'avatarURL' });
    const tags = useWatch({ control, name: 'tags' });
    const locationValue = useWatch({ control, name: 'location' });

    // Reset form when targetUser changes
    useEffect(() => {
        if (targetUser) {
            const newValues = getInitialValues(targetUser);
            reset(newValues, { 
                keepDirty: false, 
                keepTouched: false,
                keepErrors: false 
            });
        }
    }, [targetUser, reset]);

    const effectiveChanges = React.useMemo(() => {
        const values = form.getValues();
        return computeChanged(values, formState.dirtyFields, targetUser);
    }, [targetUser, formState.dirtyFields, avatar, avatarURL, tags, locationValue]);

    const canSave =
        Object.keys(effectiveChanges).length > 0 && !loading && !isSubmitting;

    useEffect(() => {
        if (!toastMessage) return;
        const t = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(t);
    }, [toastMessage]);

    useEffect(() => {
        let objectUrl: string | undefined;

        if (avatar && (avatar as File[]).length > 0) {
            const file = (avatar as File[])[0];
            if (file instanceof File) {
                objectUrl = URL.createObjectURL(file);
                setPreviewUrl(objectUrl);
            }
        }
        else if (typeof avatarURL === 'string' && avatarURL.trim()) {
            setPreviewUrl(avatarURL.trim());
        }
        else {
            setPreviewUrl(null);
        }

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [avatar, avatarURL]);

    const handleFileSelect = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                form.setValue('avatar', [files[0]], {
                    shouldDirty: true,
                    shouldValidate: true
                });
                form.setValue('avatarURL', '', {
                    shouldDirty: true,
                    shouldValidate: true
                });
                setShowImageOptions(false);
            }
        },
        [form]
    );

    const handleURLSubmit = React.useCallback(() => {
        const url = urlInputRef.current?.value?.trim();
        if (url) {
            form.setValue('avatarURL', url, {
                shouldDirty: true,
                shouldValidate: true
            });
            form.setValue('avatar', [], {
                shouldDirty: true,
                shouldValidate: true
            });
            setShowImageOptions(false);
            if (urlInputRef.current) urlInputRef.current.value = '';
        }
    }, [form]);

    const clearImage = React.useCallback(() => {
        form.setValue('avatar', [], {
            shouldDirty: true,
            shouldValidate: true
        });
        form.setValue('avatarURL', '', {
            shouldDirty: true,
            shouldValidate: true
        });
        setPreviewUrl(null);
        fileInputRef.current && (fileInputRef.current.value = '');
        urlInputRef.current && (urlInputRef.current.value = '');
        setShowImageOptions(false);
    }, [form]);

    const handleFormSubmit = async () => {
        const values = form.getValues();
        const changed = computeChanged(
            values,
            form.formState.dirtyFields,
            targetUser
        );

        if (Object.keys(changed).length === 0) {
            setToastType('error');
            setToastMessage('No changes to save.');
            return;
        }

        setLoading(true);
        setIsSubmitting(true);
        setToastMessage(null);

        try {
            const hasFile = changed.avatar instanceof File;
            let payload: any = changed;

            if (hasFile) {
                const fd = new FormData();
                if (changed.email) fd.append('email', changed.email);
                if (changed.about) fd.append('about', changed.about);
                if (changed.avatar) fd.append('avatar', changed.avatar as File);
                if (changed.tags)
                    fd.append('tags', JSON.stringify(changed.tags));
                if (changed.location)
                    fd.append('location', JSON.stringify(changed.location));
                payload = fd;
            }

            const updatedUser = await updateUser(
                payload,
                targetUserID.toString(),
                token
            );

            // Update the auth cache if editing current user
            if (user?.id === targetUser.id) {
                updateUserCache(updatedUser);
            }
            
            setTargetUser?.(updatedUser);
            setPreviewUrl(null);

            // Reset form with new values
            const newValues = getInitialValues(updatedUser);
            form.reset(newValues, { 
                keepDirty: false, 
                keepTouched: false 
            });

            setToastType('success');
            setToastMessage('Profile updated successfully');
            
            // Close after a short delay to show success message
            setTimeout(() => {
                onClose();
            }, 1500);
        }
        catch (err: any) {
            const str =
                err?.response?.data?.errors?.[0]?.message ||
                err?.response?.data?.message ||
                err?.message ||
                'Update failed';
            setToastType('error');
            setToastMessage(str);
        }
        finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pwForm.next || pwForm.next !== pwForm.confirm) {
            setToastType('error');
            setToastMessage('Passwords do not match.');
            return;
        }
        // TODO: integrate real API
        setToastType('success');
        setToastMessage('Password change requested (stub).');
        setPwForm({ current: '', next: '', confirm: '' });
    };

    const handleLogoutOtherSessions = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: integrate real API
        setToastType('success');
        setToastMessage('Requested logging out other sessions (stub).');
        setLogoutPassword('');
    };

    const handleDeleteAccount = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: integrate real API
        setToastType('error');
        setToastMessage('Account deletion is not implemented yet.');
    };

    return (
        <>
            <div className='max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg'>
                <PageHeader onBack={onClose} />

                <SettingsSection
                    title='Personal Information'
                    description='Use a valid email and keep your profile fresh.'
                >
                    {/* Avatar */}
                    <div className='col-span-full flex items-center gap-6 mb-6'>
                        <PreviewAvatar
                            previewUrl={previewUrl}
                            targetUser={targetUser}
                        />
                        <div className='relative'>
                            <Button
                                variant='secondary'
                                onClick={() => setShowImageOptions((v) => !v)}
                            >
                                Change avatar
                            </Button>
                            <AvatarMenu
                                open={showImageOptions}
                                fileInputRef={fileInputRef}
                                urlInputRef={urlInputRef}
                                watchedAvatar={avatar as any}
                                watchedAvatarURL={avatarURL as any}
                                onFileChange={handleFileSelect}
                                onURLSubmit={handleURLSubmit}
                                onClear={clearImage}
                                onClose={() => setShowImageOptions(false)}
                            />
                        </div>
                    </div>

                    {/* Main form */}
                    <form
                        onSubmit={form.handleSubmit(handleFormSubmit)}
                        className='space-y-6'
                    >
                        <FormField label='Email'>
                            <Input
                                name='email'
                                form={form}
                                label=''
                                placeholder={targetUser.email || 'Enter email address'}
                            />
                        </FormField>

                        <FormField
                            label='Description'
                            help='This will appear on your public profile.'
                        >
                            <Input
                                data-testid='about'
                                name='about'
                                form={form}
                                label=''
                                placeholder='Write a short bio...'
                                multiline
                            />
                        </FormField>

                        <FormField help='These tags appear on your profile. Use interests, skills, or hobbies.'>
                            <TagInput
                                initialTags={tags}
                                onTagsChange={(nextTags) => {
                                    const next = nextTags.map((t) => t.name);
                                    const prev = form.getValues('tags') || [];
                                    if (
                                        JSON.stringify(next) !==
                                        JSON.stringify(prev)
                                    ) {
                                        form.setValue('tags', next, {
                                            shouldDirty: true,
                                            shouldValidate: true
                                        });
                                    }
                                }}
                            />
                        </FormField>

                        <FormField label='Location'>
                            <MapDisplay
                                regionID={targetUser.location?.regionID}
                                width={400}
                                height={300}
                                showAddressBar
                                exactLocation
                                shouldGetYourLocation
                                onLocationChange={(data) => {
                                    if (!data.changed) return;
                                    if (data.coordinates) {
                                        setLocation(data.coordinates);
                                        const next = {
                                            ...data.coordinates,
                                            name: data.name,
                                            regionID: data.placeID
                                        };
                                        const prev =
                                            form.getValues('location') || null;
                                        const changed = !deepEqual(next, prev);
                                        if (changed) {
                                            form.setValue('location', next, {
                                                shouldDirty: true,
                                                shouldValidate: true
                                            });
                                        }
                                    }
                                }}
                            />
                        </FormField>

                        <ActionsBar
                            canSave={canSave}
                            isSubmitting={isSubmitting}
                            onCancel={onClose}
                        />

                        <ErrorList errors={form.formState.errors as any} />
                    </form>
                </SettingsSection>

                <SettingsSection
                    title='Change password'
                    description='Update the password associated with your account.'
                >
                    <form className='space-y-6' onSubmit={handleChangePassword}>
                        <FormField label='Current password'>
                            <input
                                type='password'
                                value={pwForm.current}
                                onChange={(e) =>
                                    setPwForm((s) => ({
                                        ...s,
                                        current: e.target.value
                                    }))
                                }
                                className='mt-2 block w-full rounded-md bg-white px-3 py-2 text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10'
                            />
                        </FormField>

                        <div className='grid sm:grid-cols-2 gap-6'>
                            <FormField label='New password'>
                                <input
                                    type='password'
                                    value={pwForm.next}
                                    onChange={(e) =>
                                        setPwForm((s) => ({
                                            ...s,
                                            next: e.target.value
                                        }))
                                    }
                                    className='mt-2 block w-full rounded-md bg-white px-3 py-2 text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10'
                                />
                            </FormField>
                            <FormField label='Confirm password'>
                                <input
                                    type='password'
                                    value={pwForm.confirm}
                                    onChange={(e) =>
                                        setPwForm((s) => ({
                                            ...s,
                                            confirm: e.target.value
                                        }))
                                    }
                                    className='mt-2 block w-full rounded-md bg-white px-3 py-2 text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10'
                                />
                            </FormField>
                        </div>

                        <Button type='submit'>Save</Button>
                    </form>
                </SettingsSection>

                <SettingsSection
                    title='Log out other sessions'
                    description='Enter your password to log out from other devices.'
                >
                    <form
                        className='space-y-6'
                        onSubmit={handleLogoutOtherSessions}
                    >
                        <FormField label='Your password'>
                            <input
                                type='password'
                                value={logoutPassword}
                                onChange={(e) =>
                                    setLogoutPassword(e.target.value)
                                }
                                className='mt-2 block w-full rounded-md bg-white px-3 py-2 text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10'
                            />
                        </FormField>
                        <Button type='submit'>Log out other sessions</Button>
                    </form>
                </SettingsSection>

                <SettingsSection
                    title='Delete account'
                    description='This cannot be undone. All information will be permanently removed.'
                    noBorder
                >
                    <form
                        className='flex items-start'
                        onSubmit={handleDeleteAccount}
                    >
                        <Button type='submit' variant='danger'>
                            Yes, delete my account
                        </Button>
                    </form>
                </SettingsSection>
            </div>

            {/* Global toast */}
            {toastMessage && (
                <div className='fixed bottom-4 left-1/2 -translate-x-1/2 z-50'>
                    <Alert
                        type={toastType === 'success' ? 'success' : 'danger'}
                        title={
                            toastType === 'success' ? 'Success' : 'Error'
                        }
                        message={toastMessage}
                        show={!!toastMessage}
                        onClose={() => setToastMessage(null)}
                    />
                </div>
            )}

            {/* click-away for avatar menu */}
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
