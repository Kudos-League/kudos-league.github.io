import React, { useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import useLocation from '@/hooks/useLocation';

import { useUpdateUser } from '@/shared/api/mutations/users';

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

const bustCache = (u: string) => `${u}${u.includes('?') ? '&' : '?'}t=${Date.now()}`;

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
    const { user, updateUser: updateUserCache } = useAuth();

    const { setLocation } = useLocation();
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const [showImageOptions, setShowImageOptions] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const urlInputRef = useRef<HTMLInputElement>(null);
    const objectUrlRef = useRef<string | null>(null);
    const currentFileRef = useRef<File | null>(null);
    const [logoutPassword, setLogoutPassword] = useState('');
    const [pwForm, setPwForm] = useState({
        current: '',
        next: '',
        confirm: ''
    });

    const targetUserID = targetUser?.id;

    const updateUserMutation = useUpdateUser(targetUserID?.toString() ?? 'me');
    const defaults = React.useMemo(() => ({
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: [],
        location: user.location || undefined,
        tags: user.tags.map(t => t.name) || [],
        about: user.settings?.about || '',
        avatarURL: ''
    }), [user.id]);
    const form = useForm<ProfileFormValues>({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: defaults
    });
    const { control } = form;
    const allValues = useWatch({ control }); 
    const avatar = useWatch({ control, name: 'avatar' });
    const avatarURL = useWatch({ control, name: 'avatarURL' });
    const tags = useWatch({ control, name: 'tags' });

    const resetFromUser = (u: UserDTO) => {
        form.reset(
            {
                ...defaults,
                email: u.email,
                displayName: u.displayName || '',
                username: u.username || '',
                about: u.settings?.about || '',
                tags: (u.tags || []).map((t: any) => t.name),
                location: u.location || undefined
            },
            { keepDirty: false, keepTouched: false }
        );
    };

    const baselineRef = React.useRef(defaults);

    const effectiveChanges = React.useMemo(() => {
        return computeChanged(form.getValues(), baselineRef.current);
    }, [allValues]);

    const canSave = Object.keys(effectiveChanges).length > 0 && !updateUserMutation.isPending;

    useEffect(() => {
        form.reset(defaults, { keepDirty: false, keepTouched: false });
    }, [user?.id]);
    
    useEffect(() => {
        if (!toastMessage) return;
        const t = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(t);
    }, [toastMessage]);

    useEffect(() => {
        const file =
            Array.isArray(avatar) && avatar.length > 0 && avatar[0] instanceof File
                ? (avatar[0] as File)
                : null;
        const url = typeof avatarURL === 'string' ? avatarURL.trim() : '';

        if (file) {
            if (currentFileRef.current !== file) {
                if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = URL.createObjectURL(file);
                currentFileRef.current = file;
                setPreviewUrl(objectUrlRef.current);
            }
            return;
        }

        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
            currentFileRef.current = null;
        }

        if (url) {
            setPreviewUrl(prev => (prev === url ? prev : url));
            return;
        }

        const fallback = targetUser?.avatar ?? null;
        setPreviewUrl(prev => (prev === fallback ? prev : fallback));
    }, [avatar, avatarURL, targetUser?.avatar]);

    useEffect(() => {
        return () => {
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        };
    }, []);

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
        if (Object.keys(effectiveChanges).length === 0) {
            setToastType('error');
            setToastMessage('No changes to save.');
            return;
        }

        setToastMessage(null);

        try {
            const payload: any = { ...effectiveChanges };

            if ('avatar' in payload) {
                const a: any = (payload as any).avatar;

                if (a instanceof File) {
                    (payload as any).avatar = a;
                }
                else if (Array.isArray(a) && a.length > 0 && a[0] instanceof File) {
                    (payload as any).avatar = a[0];
                }
                else if (typeof a === 'string' && a.trim()) {
                    (payload as any).avatarURL = a.trim();
                    delete (payload as any).avatar;
                }
                else {
                    delete (payload as any).avatar;
                }
            }

            const updatedUser = await updateUserMutation.mutateAsync(payload);

            if (user?.id === targetUser.id) {
                updateUserCache({ ...user, ...updatedUser, avatar: updatedUser.avatar ?? user.avatar });
            }

            if (setTargetUser) {
                setTargetUser({
                    ...targetUser,
                    ...updatedUser,
                    avatar: updatedUser.avatar ?? targetUser.avatar,
                });
            }

            if ('avatar' in effectiveChanges || 'avatarURL' in effectiveChanges) {
                setPreviewUrl(updatedUser.avatar ? bustCache(updatedUser.avatar) : null);
            }

            resetFromUser(updatedUser);

            setToastType('success');
            setToastMessage('Profile updated successfully');
            
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

                        <FormField label='Username'>
                            <Input
                                name='username'
                                form={form}
                                label=''
                                placeholder={user.username}
                            />
                        </FormField>

                        <FormField label='Display Name'>
                            <Input
                                name='displayName'
                                form={form}
                                label=''
                                placeholder={user.displayName}
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
                            isSubmitting={updateUserMutation.isPending}
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
