import React, { useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';

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
import { useDeleteAccountMutation } from '@/shared/api/mutations/users';
import { useBlockedUsersQuery } from '@/shared/api/queries/users';
import OAuthConnectButton from '@/components/login/OAuthConnectButton';
import OAuthDisconnectButton from '@/components/login/OAuthDisconnectButton';
import { useAuth } from '@/contexts/useAuth';
import useLocation, { MapCoordinates } from '@/hooks/useLocation';
import { useBlockedUsers } from '@/contexts/useBlockedUsers';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import UserCard from '@/components/users/UserCard';

const bustCache = (u: string) =>
    `${u}${u.includes('?') ? '&' : '?'}t=${Date.now()}`;

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
    const auth = useAuth();
    const { user, updateUser: updateUserCache } = auth;
    const { useDyslexicFont, setUseDyslexicFont } = useAccessibility();
    const wasInvited = !!targetUser.invitedByUserID;
    const isAdminEditingOther =
        !!auth.user?.admin && auth.user.id !== targetUser.id;
    const canEditProfile = !!auth.user?.admin || auth.user.id === targetUser.id;

    const {
        setLocation,
        location: browserLocation,
        errorMsg: locationError
    } = useLocation();
    const {
        blockedUsers,
        unblock,
        loading: blockingLoading
    } = useBlockedUsers();
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
    const [locationLabel, setLocationLabel] = useState<string>(
        targetUser?.location?.name || ''
    );
    const deleteAccountMutation = useDeleteAccountMutation();
    const { data: blockedUsersDetails, isLoading: blockedUsersLoading } = useBlockedUsersQuery(blockedUsers);

    const targetUserID = targetUser?.id;

    const updateUserMutation = useUpdateUser(targetUserID?.toString() ?? 'me');
    const defaults = React.useMemo(() => {
        // Normalize location to only include expected fields
        // Use targetUser.location as the source of truth since that's what MapDisplay uses
        const sourceLocation = targetUser?.location || user.location;
        let normalizedLocation = undefined;
        if (sourceLocation) {
            const { latitude, longitude, name, regionID } = sourceLocation;
            // Only include if we have the core location data
            if (latitude != null && longitude != null) {
                normalizedLocation = {
                    latitude,
                    longitude,
                    name: name || '',
                    regionID: regionID || null
                };
            }
        }

        return {
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            avatar: [],
            location: normalizedLocation,
            tags: user.tags.map((t) => t.name) || [],
            about: user.settings?.about || '',
            profession: user.settings?.profession || '',
            avatarURL: '',
            admin: targetUser?.admin ?? false,
            kudos: targetUser?.kudos ?? 0
        };
    }, [
        user.email,
        user.username,
        user.displayName,
        JSON.stringify(targetUser?.location),
        JSON.stringify(user.location),
        JSON.stringify(user.tags),
        user.settings?.about,
        user.settings?.profession,
        targetUser?.admin,
        targetUser?.kudos
    ]);
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
        // Normalize location to match defaults
        let normalizedLocation = undefined;
        if (u.location) {
            const { latitude, longitude, name, regionID } = u.location;
            if (latitude != null && longitude != null) {
                normalizedLocation = {
                    latitude,
                    longitude,
                    name: name || '',
                    regionID: regionID || null
                };
            }
        }

        form.reset(
            {
                ...defaults,
                email: u.email,
                displayName: u.displayName || '',
                username: u.username || '',
                about: u.settings?.about || '',
                profession: u.settings?.profession || '',
                tags: (u.tags || []).map((t: any) => t.name),
                location: normalizedLocation,
                admin: u.admin ?? false,
                kudos: (u as any).kudos ?? 0
            },
            { keepDirty: false, keepTouched: false }
        );
    };

    const baselineRef = React.useRef(defaults);
    // Track the initial location name from MapDisplay (more accurate than defaults)
    const initialLocationNameRef = React.useRef<string | null>(null);

    const effectiveChanges = React.useMemo(() => {
        // Use the initial location name from MapDisplay if available
        const baselineWithInitialLocation = initialLocationNameRef.current !== null
            ? {
                ...defaults,
                location: defaults.location
                    ? { ...defaults.location, name: initialLocationNameRef.current }
                    : initialLocationNameRef.current
                        ? { name: initialLocationNameRef.current, latitude: 0, longitude: 0, regionID: null }
                        : undefined
            }
            : defaults;
        return computeChanged(form.getValues(), baselineWithInitialLocation);
    }, [allValues, defaults]);

    const canSave =
        Object.keys(effectiveChanges).length > 0 &&
        !updateUserMutation.isPending;

    useEffect(() => {
        // Update baseline first
        baselineRef.current = defaults as any;
        // Then reset form to match
        form.reset(defaults, { keepDirty: false, keepTouched: false });
    }, [user?.id, defaults, form]);

    useEffect(() => {
        baselineRef.current = defaults as any;
    }, [defaults]);

    useEffect(() => {
        if (!toastMessage) return;
        const t = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(t);
    }, [toastMessage]);

    useEffect(() => {
        const file =
            Array.isArray(avatar) &&
            avatar.length > 0 &&
            avatar[0] instanceof File
                ? (avatar[0] as File)
                : null;
        const url = typeof avatarURL === 'string' ? avatarURL.trim() : '';

        if (file) {
            if (currentFileRef.current !== file) {
                if (objectUrlRef.current)
                    URL.revokeObjectURL(objectUrlRef.current);
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
            setPreviewUrl((prev) => (prev === url ? prev : url));
            return;
        }

        const fallback = targetUser?.avatar ?? null;
        setPreviewUrl((prev) => (prev === fallback ? prev : fallback));
    }, [avatar, avatarURL, targetUser?.avatar]);

    useEffect(() => {
        return () => {
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        };
    }, []);


    const handleFileSelect = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                form.setValue('avatar', [file] as any, {
                    shouldDirty: true,
                    shouldValidate: true
                });
                form.setValue('avatarURL', '', {
                    shouldDirty: true,
                    shouldValidate: true
                });
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

    const handleUseCurrentLocation = React.useCallback(async () => {
        // Request location permission if not already granted
        if (!browserLocation && !locationError) {
            try {
                await navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                    },
                    (error) => {
                        setToastType('error');
                        setToastMessage(
                            'Location access denied. Please enable location permissions in your browser.'
                        );
                    }
                );
                return; // Wait for the location to be set
            }
            catch (err) {
                setToastType('error');
                setToastMessage(
                    'Unable to access location. Please check your browser settings.'
                );
                return;
            }
        }

        if (locationError) {
            setToastType('error');
            setToastMessage(
                'Unable to get your location. Please enable location services in your browser.'
            );
            return;
        }

        if (!browserLocation) {
            setToastType('error');
            setToastMessage(
                'Waiting for browser location... Please allow location access when prompted.'
            );
            return;
        }

        try {
            const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${browserLocation.latitude},${browserLocation.longitude}&key=${GOOGLE_MAPS_KEY}`
            );
            const data = await response.json();

            if (data.status !== 'OK' || !data.results?.[0]) {
                throw new Error('Failed to geocode location');
            }

            const result = data.results[0];
            const placeID = result.place_id;
            const formatted = result.formatted_address || '';

            const next = {
                latitude: browserLocation.latitude,
                longitude: browserLocation.longitude,
                name: formatted,
                regionID: placeID
            };

            setLocation(browserLocation);
            form.setValue('location', next, {
                shouldDirty: true,
                shouldValidate: true
            });
            setLocationLabel(formatted);
            setToastType('success');
            setToastMessage('Current location set successfully!');
        }
        catch (err) {
            console.error('Failed to set current location:', err);
            setToastType('error');
            setToastMessage(
                'Failed to set current location. Please try again.'
            );
        }
    }, [browserLocation, locationError, form, setLocation]);

    const handleClearLocation = React.useCallback(() => {
        setLocation(null);
        setLocationLabel('');
        form.setValue('location', null as any, {
            shouldDirty: true,
            shouldValidate: true
        });
        if (setTargetUser) {
            setTargetUser({
                ...targetUser,
                location: {
                    ...targetUser.location,
                    regionID: null
                }
            });
        }
    }, [form, setLocation, setTargetUser, targetUser]);

    const handleFormSubmit = async () => {
        if (!(Object.keys(effectiveChanges).length > 0)) {
            setToastType('error');
            setToastMessage('No changes to save.');
            return;
        }

        setToastMessage(null);

        try {
            const payload: any = { ...effectiveChanges };

            try {
                const currentLoc = form.getValues('location') ?? null;
                const baselineLoc =
                    (baselineRef.current as any)?.location ?? null;
                if (currentLoc === null && baselineLoc != null) {
                    payload.location = null;
                }
            }
            catch {
                // noop
            }

            // Clean up the location object before sending
            if ('location' in payload && payload.location) {
                const { changed, ...cleanLocation } = payload.location;
                payload.location = cleanLocation;
            }

            if ('avatar' in payload) {
                const a: any = (payload as any).avatar;

                if (a instanceof File) {
                    (payload as any).avatar = a;
                }
                else if (
                    Array.isArray(a) &&
                    a.length > 0 &&
                    a[0] instanceof File
                ) {
                    (payload as any).avatar = a[0];
                }
                else {
                    delete (payload as any).avatar;
                }
            }

            if ('avatarURL' in payload) {
                const url = (payload as any).avatarURL;
                if (typeof url !== 'string' || !url.trim()) {
                    delete (payload as any).avatarURL;
                }
            }

            if ('tags' in payload) {
                (payload as any).tags = (payload as any).tags || [];
            }
            console.log('Submitting payload:', payload); // DEBUG: See what's being sent

            const updatedUser = await updateUserMutation.mutateAsync(payload);

            console.log('Updated user:', updatedUser); // DEBUG: See what came back

            if (updatedUser?.id && updatedUser.id === auth.user?.id) {
                // Apply cache busting to avatar URL so the navbar shows the updated image
                const userToCache = {
                    ...updatedUser,
                    avatar: updatedUser.avatar
                        ? bustCache(updatedUser.avatar)
                        : null
                };
                updateUserCache(userToCache);
            }

            if (updatedUser?.id && setTargetUser) {
                setTargetUser(updatedUser);
            }

            if (
                updatedUser?.id &&
                updatedUser.id === targetUser.id &&
                updatedUser.avatar !== previewUrl
            ) {
                setPreviewUrl(
                    updatedUser.avatar ? bustCache(updatedUser.avatar) : null
                );
            }

            resetFromUser(updatedUser);

            // Normalize location for baseline
            let baselineLocation = undefined;
            if (updatedUser.location) {
                const { latitude, longitude, name, regionID } =
                    updatedUser.location;
                if (latitude != null && longitude != null) {
                    baselineLocation = {
                        latitude,
                        longitude,
                        name: name || '',
                        regionID: regionID || null
                    };
                }
            }

            baselineRef.current = {
                email: updatedUser.email,
                username: updatedUser.username,
                displayName: updatedUser.displayName ?? '',
                avatar: [],
                location: baselineLocation,
                tags: (updatedUser.tags || []).map((t: any) => t.name),
                about: updatedUser.settings?.about || '',
                profession: updatedUser.settings?.profession || '',
                avatarURL: '',
                admin: updatedUser.admin ?? false,
                kudos:
                    (updatedUser as any).kudos ?? (defaults as any).kudos ?? 0
            } as any;

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

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        const confirmed = window.confirm(
            'Are you sure you want to deactivate your account? You can contact support to reactivate later.'
        );
        if (!confirmed) return;

        try {
            await deleteAccountMutation.mutateAsync();
        }
        catch (err) {
            console.error('Failed to deactivate account:', err);
            setToastType('error');
            setToastMessage('Failed to deactivate account. Please try again.');
            return;
        }

        try {
            await auth.logout();
        }
        finally {
            window.location.assign('/');
        }
    };

    return (
        <>
            <style>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>

            <div className='w-full max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden'>
                {/* Header */}
                <div className='border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4'>
                    <div className='flex items-center justify-between min-w-0'>
                        <div className='flex items-center gap-4 min-w-0 flex-1'>
                            <button
                                onClick={onClose}
                                className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex-shrink-0'
                                aria-label='Close settings'
                            >
                                <svg
                                    className='w-6 h-6'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M6 18L18 6M6 6l12 12'
                                    />
                                </svg>
                            </button>
                            <h1 className='text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white truncate'>
                                Account Settings
                            </h1>
                        </div>
                    </div>
                </div>

                <SettingsSection
                    title='Personal Information'
                    description='Use a valid email and keep your profile fresh.'
                >
                    {/* Avatar */}
                    <div className='col-span-full flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6'>
                        <PreviewAvatar
                            previewUrl={previewUrl}
                            targetUser={targetUser}
                        />
                        {canEditProfile && (
                            <div className='relative w-full sm:w-auto'>
                                <Button
                                    variant='secondary'
                                    onClick={() =>
                                        setShowImageOptions((v) => !v)
                                    }
                                    className='w-full sm:w-auto'
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
                        )}
                    </div>

                    {/* Main form */}
                    <form
                        onSubmit={form.handleSubmit(handleFormSubmit)}
                        className='space-y-6'
                    >
                        {auth.user?.admin && (
                            <FormField label='Admin'>
                                <label className='inline-flex items-center gap-2'>
                                    <input
                                        type='checkbox'
                                        checked={!!form.watch('admin')}
                                        onChange={(e) =>
                                            form.setValue(
                                                'admin',
                                                e.target.checked,
                                                {
                                                    shouldDirty: true,
                                                    shouldValidate: true
                                                }
                                            )
                                        }
                                    />
                                    <span className='text-sm text-gray-700 dark:text-gray-200'>
                                        Grant this user admin access
                                    </span>
                                </label>
                            </FormField>
                        )}

                        {auth.user?.admin && (
                            <FormField
                                label='Kudos'
                                help={
                                    "Set the user's kudos balance (admin only)"
                                }
                            >
                                <label className='inline-flex items-center gap-2'>
                                    <input
                                        type='number'
                                        min={0}
                                        value={String(
                                            form.watch('kudos') ?? ''
                                        )}
                                        onChange={(e) => {
                                            const v =
                                                e.target.value === ''
                                                    ? undefined
                                                    : Number(e.target.value);
                                            form.setValue('kudos', v, {
                                                shouldDirty: true,
                                                shouldValidate: true
                                            });
                                        }}
                                        className='border rounded px-2 py-1'
                                        data-testid='kudos-input'
                                    />
                                    <span className='text-sm text-gray-700 dark:text-gray-200'>
                                        Adjust kudos for this user
                                    </span>
                                </label>
                            </FormField>
                        )}

                        <FormField label='Email'>
                            <div className='w-full overflow-hidden'>
                                <Input
                                    disabled={wasInvited}
                                    name='email'
                                    form={form}
                                    label=''
                                    placeholder={
                                        targetUser.email ||
                                        'Enter email address'
                                    }
                                    className='w-full'
                                />
                            </div>
                            {wasInvited && (
                                <p className='text-xs text-gray-500 italic mt-2'>
                                    Email cannot be changed for invited users
                                </p>
                            )}
                        </FormField>

                        <FormField label='Username'>
                            <div className='w-full overflow-hidden'>
                                <Input
                                    name='username'
                                    form={form}
                                    label=''
                                    placeholder={user.username}
                                    disabled={!canEditProfile}
                                    className='w-full'
                                />
                            </div>
                        </FormField>

                        <FormField label='Display Name'>
                            <div className='w-full overflow-hidden'>
                                <Input
                                    name='displayName'
                                    form={form}
                                    label=''
                                    placeholder={user.displayName}
                                    disabled={!canEditProfile}
                                    className='w-full'
                                />
                            </div>
                        </FormField>

                        <FormField
                            label='Profession'
                            help='Share your current profession or role.'
                        >
                            <div className='w-full overflow-hidden'>
                                <Input
                                    data-testid='profession'
                                    name='profession'
                                    form={form}
                                    label=''
                                    placeholder='e.g., Software Engineer'
                                    disabled={!canEditProfile}
                                    className='w-full'
                                />
                            </div>
                        </FormField>

                        <FormField
                            label='Description'
                            help='This will appear on your public profile.'
                        >
                            <div className='w-full overflow-hidden'>
                                <Input
                                    data-testid='about'
                                    name='about'
                                    form={form}
                                    label=''
                                    placeholder='Write a short bio...'
                                    multiline
                                    disabled={!canEditProfile}
                                    className='w-full'
                                />
                            </div>
                        </FormField>

                        {/* Fix for TagInput */}
                        {canEditProfile && (
                            <FormField help='These tags appear on your profile. Use interests, skills, or hobbies.'>
                                <div className='w-full overflow-hidden'>
                                    <TagInput
                                        initialTags={tags}
                                        onTagsChange={(nextTags) => {
                                            const next = nextTags.map(
                                                (t) => t.name
                                            );
                                            const prev =
                                                form.getValues('tags') || [];
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
                                        className='w-full'
                                    />
                                </div>
                            </FormField>
                        )}

                        {/* Location */}
                        {canEditProfile && (
                            <FormField
                                label='Location'
                                help='Only you can see your exact address or place name. Others see an approximate area.'
                            >
                                {locationLabel && (
                                    <div className='mb-2 flex items-center justify-between gap-2'>
                                        <div className='text-sm text-gray-700 dark:text-gray-300 truncate'>
                                            {locationLabel}
                                        </div>
                                        <Button
                                            type='button'
                                            variant='ghost'
                                            onClick={handleClearLocation}
                                            className='!text-red-600 hover:!text-red-700 !text-sm flex-shrink-0'
                                        >
                                            ✕ Remove
                                        </Button>
                                    </div>
                                )}

                                <div className='w-full overflow-hidden'>
                                    <MapDisplay
                                        regionID={targetUser.location?.regionID}
                                        width='100%'
                                        height={300}
                                        edit
                                        exactLocation
                                        shouldGetYourLocation
                                        inlineBanner={false}
                                        onLabelChange={(label) =>
                                            setLocationLabel(label)
                                        }
                                        onLocationChange={(data) => {
                                            if (!data) {
                                                setLocation(null);
                                                form.setValue(
                                                    'location',
                                                    null as any,
                                                    {
                                                        shouldDirty: true,
                                                        shouldValidate: true
                                                    }
                                                );
                                            }
                                            else {
                                                const locationValue = {
                                                    latitude:
                                                        data.coordinates
                                                            .latitude,
                                                    longitude:
                                                        data.coordinates
                                                            .longitude,
                                                    name:
                                                        data.name ||
                                                        data.businessName ||
                                                        '',
                                                    regionID: data.placeID
                                                };

                                                setLocation(data.coordinates);
                                                // Only mark as dirty if this is a user change, not initial load
                                                const isUserChange = data.changed !== false;

                                                // If this is the initial load, store the name for baseline comparison
                                                if (!isUserChange && initialLocationNameRef.current === null) {
                                                    initialLocationNameRef.current = locationValue.name;
                                                }

                                                form.setValue(
                                                    'location',
                                                    locationValue,
                                                    {
                                                        shouldDirty: isUserChange,
                                                        shouldValidate: true
                                                    }
                                                );
                                            }
                                        }}
                                    />
                                </div>
                            </FormField>
                        )}

                        {/* IMPROVED: More visible ActionsBar */}
                        <div className='sticky bottom-0 bg-white dark:bg-gray-900 pt-4 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 pb-4 z-10 -mx-4 sm:-mx-6'>
                            <div className='px-4 sm:px-6'>
                                <ActionsBar
                                    canSave={canSave}
                                    isSubmitting={updateUserMutation.isPending}
                                    onCancel={onClose}
                                />
                            </div>
                        </div>

                        <ErrorList errors={form.formState.errors as any} />
                    </form>
                </SettingsSection>

                {!isAdminEditingOther && (
                    <SettingsSection
                        title='Connected accounts'
                        description='Link or unlink your social accounts.'
                    >
                        <div className='space-y-4'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <div className='font-medium'>Discord</div>
                                    <div className='text-sm text-gray-600 dark:text-gray-300'>
                                        {user.discordID
                                            ? 'Connected'
                                            : 'Not connected'}
                                    </div>
                                </div>
                                {user.discordID ? (
                                    <OAuthDisconnectButton
                                        provider='discord'
                                        onSuccess={() => {
                                            updateUserCache({
                                                discordID: undefined as any
                                            });
                                            setToastType('success');
                                            setToastMessage(
                                                'Discord disconnected'
                                            );
                                        }}
                                        onError={(m) => {
                                            setToastType('error');
                                            setToastMessage(m);
                                        }}
                                    />
                                ) : (
                                    <OAuthConnectButton provider='discord'>
                                        Connect
                                    </OAuthConnectButton>
                                )}
                            </div>

                            <div className='flex items-center justify-between'>
                                <div>
                                    <div className='font-medium'>Google</div>
                                    <div className='text-sm text-gray-600 dark:text-gray-300'>
                                        {user.googleID
                                            ? 'Connected'
                                            : 'Not connected'}
                                    </div>
                                </div>
                                {user.googleID ? (
                                    <OAuthDisconnectButton
                                        provider='google'
                                        onSuccess={() => {
                                            updateUserCache({
                                                googleID: undefined as any
                                            });
                                            setToastType('success');
                                            setToastMessage(
                                                'Google disconnected'
                                            );
                                        }}
                                        onError={(m) => {
                                            setToastType('error');
                                            setToastMessage(m);
                                        }}
                                    />
                                ) : (
                                    <OAuthConnectButton provider='google'>
                                        Connect
                                    </OAuthConnectButton>
                                )}
                            </div>
                        </div>
                    </SettingsSection>
                )}

                {!isAdminEditingOther && (
                    <SettingsSection
                        title='Accessibility'
                        description='Customize your experience for better readability.'
                    >
                        <div className='flex items-center justify-between'>
                            <div className='flex-1'>
                                <label
                                    htmlFor='dyslexic-font-toggle'
                                    className='text-sm font-medium text-gray-700 dark:text-gray-200'
                                >
                                    OpenDyslexic Font
                                </label>
                                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                    Use a font designed to increase readability
                                    for readers with dyslexia
                                </p>
                            </div>
                            <button
                                id='dyslexic-font-toggle'
                                role='switch'
                                aria-checked={useDyslexicFont}
                                onClick={() =>
                                    setUseDyslexicFont(!useDyslexicFont)
                                }
                                className={[
                                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                                    useDyslexicFont
                                        ? 'bg-blue-600'
                                        : 'bg-gray-200 dark:bg-gray-700'
                                ].join(' ')}
                            >
                                <span
                                    className={[
                                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                        useDyslexicFont
                                            ? 'translate-x-5'
                                            : 'translate-x-0'
                                    ].join(' ')}
                                />
                            </button>
                        </div>
                    </SettingsSection>
                )}

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
                                className='mt-2 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 dark:focus:border-indigo-500 dark:focus:ring-indigo-500'
                            />
                        </FormField>

                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                            <FormField label='New password'>
                                <input
                                    type='password'
                                    value={pwForm.current}
                                    onChange={(e) =>
                                        setPwForm((s) => ({
                                            ...s,
                                            current: e.target.value
                                        }))
                                    }
                                    className='mt-2 block w-full max-w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 dark:focus:border-indigo-500 dark:focus:ring-indigo-500'
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
                                    className='mt-2 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 dark:focus:border-indigo-500 dark:focus:ring-indigo-500'
                                />
                            </FormField>
                        </div>

                        <Button type='submit'>Save</Button>
                    </form>
                </SettingsSection>

                {!isAdminEditingOther && (
                    <SettingsSection
                        title='Blocked Users'
                        description='Users you have blocked. Unblock them to send messages or view their content.'
                    >
                        {blockingLoading || blockedUsersLoading ? (
                            <div className='flex items-center justify-center py-4'>
                                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
                            </div>
                        ) : !blockedUsersDetails || blockedUsersDetails.length === 0 ? (
                            <p className='text-gray-500 dark:text-gray-400 text-sm'>
                                No blocked users.
                            </p>
                        ) : (
                            <div className='space-y-3'>
                                {blockedUsersDetails.map((blockedUser) => (
                                    <div
                                        key={blockedUser.id}
                                        className='flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                                    >
                                        <div className='flex items-center gap-3 flex-1 min-w-0'>
                                            <UserCard user={blockedUser} />
                                        </div>
                                        <Button
                                            onClick={async () => {
                                                try {
                                                    await unblock(
                                                        blockedUser.id
                                                    );
                                                    setToastMessage(
                                                        `Unblocked ${blockedUser.username}`
                                                    );
                                                    setToastType('success');
                                                }
                                                catch (err) {
                                                    setToastMessage(
                                                        'Failed to unblock user'
                                                    );
                                                    setToastType('error');
                                                }
                                            }}
                                            variant='secondary'
                                            className='flex-shrink-0'
                                        >
                                            Unblock
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </SettingsSection>
                )}

                {!isAdminEditingOther && (
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
                                    className='mt-2 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 dark:focus:border-indigo-500 dark:focus:ring-indigo-500'
                                />
                            </FormField>
                            <Button type='submit'>
                                Log out other sessions
                            </Button>
                        </form>
                    </SettingsSection>
                )}

                {!isAdminEditingOther && (
                    <SettingsSection
                        title='Deactivate account'
                        description='This deactivates your account. You may request reactivation later.'
                        noBorder
                    >
                        <form
                            className='flex items-start'
                            onSubmit={handleDeleteAccount}
                        >
                            <Button type='submit' variant='danger'>
                                Deactivate my account
                            </Button>
                        </form>
                    </SettingsSection>
                )}
            </div>

            {/* FLOATING SAVE BAR - Slides up from bottom when there are unsaved changes */}
            {canSave && (
                <div className='fixed bottom-0 left-0 right-0 z-50 animate-slide-up'>
                    <div className='bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800 shadow-2xl'>
                        <div className='max-w-5xl mx-auto px-4 sm:px-6 py-4'>
                            <div className='flex items-center justify-between gap-4'>
                                {/* Left side - Change indicator */}
                                <div className='flex items-center gap-3 text-white'>
                                    <div className='hidden sm:flex items-center justify-center w-10 h-10 bg-white/20 rounded-full flex-shrink-0'>
                                        <svg
                                            className='w-5 h-5'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className='font-semibold text-sm sm:text-base'>
                                            Unsaved Changes
                                        </div>
                                        <div className='text-xs sm:text-sm text-indigo-100'>
                                            You have{' '}
                                            {
                                                Object.keys(effectiveChanges)
                                                    .length
                                            }{' '}
                                            unsaved{' '}
                                            {Object.keys(effectiveChanges)
                                                .length === 1
                                                ? 'change'
                                                : 'changes'}
                                        </div>
                                    </div>
                                </div>

                                {/* Right side - Action buttons */}
                                <div className='flex items-center gap-2 sm:gap-3'>
                                    <button
                                        type='button'
                                        onClick={onClose}
                                        className='px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors'
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type='button'
                                        onClick={handleFormSubmit}
                                        disabled={updateUserMutation.isPending}
                                        className='px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-semibold bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                                    >
                                        {updateUserMutation.isPending ? (
                                            <>
                                                <svg
                                                    className='animate-spin h-4 w-4'
                                                    fill='none'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <circle
                                                        className='opacity-25'
                                                        cx='12'
                                                        cy='12'
                                                        r='10'
                                                        stroke='currentColor'
                                                        strokeWidth='4'
                                                    ></circle>
                                                    <path
                                                        className='opacity-75'
                                                        fill='currentColor'
                                                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                                    ></path>
                                                </svg>
                                                <span className='hidden sm:inline'>
                                                    Saving...
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <svg
                                                    className='w-4 h-4 sm:w-5 sm:h-5'
                                                    fill='none'
                                                    viewBox='0 0 24 24'
                                                    stroke='currentColor'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M5 13l4 4L19 7'
                                                    />
                                                </svg>
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Global toast */}
            {toastMessage && (
                <div className='fixed bottom-4 left-1/2 -translate-x-1/2 z-50'>
                    <Alert
                        type={toastType === 'success' ? 'success' : 'danger'}
                        title={toastType === 'success' ? 'Success' : 'Error'}
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
