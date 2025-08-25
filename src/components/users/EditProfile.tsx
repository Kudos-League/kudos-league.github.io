import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import useLocation from '@/hooks/useLocation';
import AvatarComponent from '@/components/users/Avatar';
import Input from '@/components/forms/Input';
import MapDisplay from '@/components/Map';
import { useAuth } from '@/hooks/useAuth';
import { updateUser } from '@/shared/api/actions';

import type { ProfileFormValues, UserDTO } from '@/shared/api/types';
import TagInput from '@/components/TagInput';
import Alert from '@/components/common/Alert';
import Button from '../common/Button';
import deepEqual from '@/shared/deepEqual';

interface Props {
    targetUser: UserDTO;
    setTargetUser?: (user: UserDTO) => void;
    userSettings?: any;
    onClose: () => void;
}

const computeChanged = (
    values: ProfileFormValues,
    dirty: any,
    user: UserDTO
) => {
    const changed: any = {};

    if (dirty.email && values.email?.trim() && values.email.trim() !== (user.email || '')) {
        changed.email = values.email.trim();
    }

    if (dirty.about) {
        const about = (values.about || '').trim();
        if (about && about !== (user.settings?.about || '')) {
            changed.about = about;
        }
    }

    // tags (string[] -> [{ name }]) and compare to original
    if (dirty.tags) {
        const origTagObjs = (user.tags || []).map(t => ({ name: (t.name || '').trim() })).filter(t => t.name);
        const newTagObjs = (Array.isArray(values.tags) ? values.tags : [])
            .map((t: any) => (typeof t === 'string' ? t.trim() : t?.name?.trim()))
            .filter(Boolean)
            .map((name: string) => ({ name }));

        // only set if actually different
        if (!deepEqual(newTagObjs, origTagObjs)) {
            changed.tags = newTagObjs;
        }
    }

    // location (compare to original without client-only flags)
    if (dirty.location && values.location) {
        const newLoc = { ...values.location };
        delete (newLoc as any).changed;
        if (!deepEqual(newLoc, user.location || null)) {
            changed.location = newLoc;
        }
    }

    // avatar (file or URL)
    const avatarDirty = !!dirty.avatar || !!dirty.avatarURL;
    if (avatarDirty) {
        const arr = Array.isArray(values.avatar) ? values.avatar : (values.avatar ? [values.avatar] : []);
        const fileOrString = arr[0];

        if (fileOrString instanceof File) {
            changed.avatar = fileOrString;
        }
        else if (typeof values.avatarURL === 'string' && values.avatarURL.trim()) {
            changed.avatar = values.avatarURL.trim();
        }
    }

    return changed;
};

const PreviewAvatar = ({ previewUrl, targetUser }: { previewUrl: string | null; targetUser: UserDTO }) => {
    if (previewUrl) {
        return (
            <img
                src={previewUrl}
                alt={targetUser.username || 'User'}
                className='rounded-full object-cover'
                style={{ width: 100, height: 100 }}
            />
        );
    }
    return (
        <AvatarComponent
            avatar={targetUser.avatar}
            username={targetUser.username}
            size={100}
        />
    );
};

const PageHeader: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10">
        <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account Settings</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Update your profile and preferences.</p>
        </div>
        <Button variant="secondary" onClick={onBack}>
            ← Back
        </Button>
    </div>
);

const SettingsSection: React.FC<{
  title: string;
  description?: string;
  noBorder?: boolean;
  children: React.ReactNode;
}> = ({ title, description, noBorder, children }) => (
    <div
        className={
            'grid gap-y-10 gap-x-8 px-6 py-10 md:grid-cols-3 ' +
      (noBorder ? '' : 'border-b border-gray-200 dark:border-white/10')
        }
    >
        <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
            {description ? (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            ) : null}
        </div>
        <div className="md:col-span-2">{children}</div>
    </div>
);

const FormField: React.FC<{
  label?: string;
  help?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, help, children }) => (
    <div>
        {label ? (
            <label className="block font-semibold mb-1 text-gray-900 dark:text-white">{label}</label>
        ) : null}
        {children}
        {help ? <p className="text-xs text-gray-500 italic mt-2">{help}</p> : null}
    </div>
);

const AvatarMenu: React.FC<{
  open: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  urlInputRef: React.RefObject<HTMLInputElement>;
  watchedAvatar?: File[];
  watchedAvatarURL?: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onURLSubmit: () => void;
  onClear: () => void;
  onClose: () => void;
}> = ({
    open,
    fileInputRef,
    urlInputRef,
    watchedAvatar,
    watchedAvatarURL,
    onFileChange,
    onURLSubmit,
    onClear,
    onClose
}) =>
    !open ? null : (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg shadow-lg p-4 z-10">
            <div className="space-y-3">
                <p className="font-medium text-gray-900 dark:text-white">Change Profile Picture</p>

                {/* File Upload */}
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onFileChange}
                        className="hidden"
                        id="avatar-file-input"
                    />
                    <label
                        htmlFor="avatar-file-input"
                        className="block w-full text-center bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-3 py-2 cursor-pointer hover:bg-indigo-100 dark:bg-white/10 dark:text-white dark:border-white/10"
                    >
                        📁 Upload Image
                    </label>
                </div>

                {/* URL input */}
                <div className="flex gap-2">
                    <input
                        ref={urlInputRef}
                        type="text"
                        placeholder="Paste image URL..."
                        className="flex-1 border border-gray-300 dark:border-white/10 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        onKeyDown={(e) => e.key === 'Enter' && onURLSubmit()}
                    />
                    <Button onClick={onURLSubmit} className="text-sm">
                        Apply
                    </Button>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                    {(watchedAvatar?.length || (watchedAvatarURL || '').trim()) ? (
                        <button type="button" onClick={onClear} className="text-xs text-red-600 hover:text-red-700">
                            Remove Image
                        </button>
                    ) : null}
                    <Button variant="secondary" className="text-xs ml-auto" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );

const ErrorList: React.FC<{ errors: Record<string, any> }> = ({ errors }) => {
    const keys = Object.keys(errors || {});
    if (!keys.length) return null;
    return (
        <div className="mt-4 space-y-2">
            {keys.map((field) => (
                <p key={field} className="text-sm text-red-600">
                    {field}: {errors[field]?.message || 'Invalid value'}
                </p>
            ))}
        </div>
    );
};

const ActionsBar: React.FC<{
  canSave: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
}> = ({ canSave, isSubmitting, onCancel }) => (
    <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={!canSave} variant="success">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
      Cancel
        </Button>
    </div>
);


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
    const form = useForm<ProfileFormValues>({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            email: user.email,
            avatar: [],
            location: user.location || undefined,
            tags: user.tags.map(t => t.name) || [],
            about: user.settings?.about || '',
            avatarURL: ''
        }
    });
    const watchedAvatar = form.watch('avatar');
    const watchedAvatarURL = form.watch('avatarURL');
    const effectiveChanges = React.useMemo(() => {
        const values = form.getValues();
        return computeChanged(values, form.formState.dirtyFields, user);
    }, [form.watch(), form.formState.dirtyFields]);
    const canSave = Object.keys(effectiveChanges).length > 0 && !loading && !isSubmitting;

    useEffect(() => {
        if (!toastMessage) return;
        const t = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(t);
    }, [toastMessage]);

    useEffect(() => {
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
        setPreviewUrl(null);
    }, [watchedAvatar, watchedAvatarURL]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            form.setValue('avatar', [files[0]], { shouldDirty: true, shouldValidate: true });
            form.setValue('avatarURL', '', { shouldDirty: true, shouldValidate: true });
            setShowImageOptions(false);
        }
    };

    const handleURLSubmit = () => {
        const url = urlInputRef.current?.value?.trim();
        if (url) {
            form.setValue('avatarURL', url, { shouldDirty: true, shouldValidate: true });
            form.setValue('avatar', [], { shouldDirty: true, shouldValidate: true });
            setShowImageOptions(false);
            if (urlInputRef.current) urlInputRef.current.value = '';
        }
    };

    const clearImage = () => {
        form.setValue('avatar', [], { shouldDirty: true, shouldValidate: true });
        form.setValue('avatarURL', '', { shouldDirty: true, shouldValidate: true });
        setPreviewUrl(null);
        fileInputRef.current && (fileInputRef.current.value = '');
        urlInputRef.current && (urlInputRef.current.value = '');
        setShowImageOptions(false);
    };

    const handleFormSubmit = async () => {
        const values = form.getValues();
        const changed = computeChanged(values, form.formState.dirtyFields, user);

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
                if (changed.tags) fd.append('tags', JSON.stringify(changed.tags));
                if (changed.location) fd.append('location', JSON.stringify(changed.location));
                payload = fd;
            }

            const updatedUser = await updateUser(payload, targetUserID.toString(), token);
            updateUserCache(updatedUser);
            setTargetUser?.(updatedUser);
            setToastType('success');
            setToastMessage('Profile updated');
            onClose();
            window.location.reload();
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

    /* ---------- stub handlers for extra sections ---------- */
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
            <div className="max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg">
                <PageHeader onBack={onClose} />

                <SettingsSection
                    title="Personal Information"
                    description="Use a valid email and keep your profile fresh."
                >
                    {/* Avatar */}
                    <div className="col-span-full flex items-center gap-6 mb-6">
                        <PreviewAvatar previewUrl={previewUrl} targetUser={targetUser} />
                        <div className="relative">
                            <Button variant="secondary" onClick={() => setShowImageOptions((v) => !v)}>
                                Change avatar
                            </Button>
                            <AvatarMenu
                                open={showImageOptions}
                                fileInputRef={fileInputRef}
                                urlInputRef={urlInputRef}
                                watchedAvatar={watchedAvatar as any}
                                watchedAvatarURL={watchedAvatarURL as any}
                                onFileChange={handleFileSelect}
                                onURLSubmit={handleURLSubmit}
                                onClear={clearImage}
                                onClose={() => setShowImageOptions(false)}
                            />
                        </div>
                    </div>

                    {/* Main form */}
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                        <FormField label="Email">
                            <Input name="email" form={form} label="" placeholder={user.email} />
                        </FormField>

                        <FormField label="Description" help="This will appear on your public profile.">
                            <Input name="about" form={form} label="" placeholder="Write a short bio..." multiline />
                        </FormField>

                        <FormField
                            help="These tags appear on your profile. Use interests, skills, or hobbies."
                        >
                            <TagInput
                                initialTags={form.watch('tags')}
                                onTagsChange={(tags) => {
                                    const next = tags.map((t) => t.name);
                                    const prev = form.getValues('tags') || [];
                                    if (JSON.stringify(next) !== JSON.stringify(prev)) {
                                        form.setValue('tags', next, { shouldDirty: true, shouldValidate: true });
                                    }
                                }}
                            />
                        </FormField>

                        <FormField label="Location">
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
                                        const next = { ...data.coordinates, name: data.name, regionID: data.placeID };
                                        const prev = form.getValues('location') || null;
                                        const changed = !deepEqual(next, prev);
                                        if (changed) {
                                            form.setValue('location', next, { shouldDirty: true, shouldValidate: true });
                                        }
                                    }
                                }}
                            />
                        </FormField>

                        <ActionsBar canSave={canSave} isSubmitting={isSubmitting} onCancel={onClose} />

                        <ErrorList errors={form.formState.errors as any} />
                    </form>
                </SettingsSection>

                <SettingsSection
                    title="Change password"
                    description="Update the password associated with your account."
                >
                    <form className="space-y-6" onSubmit={handleChangePassword}>
                        <FormField label="Current password">
                            <input
                                type="password"
                                value={pwForm.current}
                                onChange={(e) => setPwForm((s) => ({ ...s, current: e.target.value }))}
                                className="mt-2 block w-full rounded-md bg-white px-3 py-2 text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10"
                            />
                        </FormField>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <FormField label="New password">
                                <input
                                    type="password"
                                    value={pwForm.next}
                                    onChange={(e) => setPwForm((s) => ({ ...s, next: e.target.value }))}
                                    className="mt-2 block w-full rounded-md bg-white px-3 py-2 text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg白/5 dark:text-white dark:outline-white/10"
                                />
                            </FormField>
                            <FormField label="Confirm password">
                                <input
                                    type="password"
                                    value={pwForm.confirm}
                                    onChange={(e) => setPwForm((s) => ({ ...s, confirm: e.target.value }))}
                                    className="mt-2 block w-full rounded-md bg-white px-3 py-2 text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg白/5 dark:text-white dark:outline-white/10"
                                />
                            </FormField>
                        </div>

                        <Button type="submit">Save</Button>
                    </form>
                </SettingsSection>

                <SettingsSection
                    title="Log out other sessions"
                    description="Enter your password to log out from other devices."
                >
                    <form className="space-y-6" onSubmit={handleLogoutOtherSessions}>
                        <FormField label="Your password">
                            <input
                                type="password"
                                value={logoutPassword}
                                onChange={(e) => setLogoutPassword(e.target.value)}
                                className="mt-2 block w-full rounded-md bg-white px-3 py-2 text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10"
                            />
                        </FormField>
                        <Button type="submit">Log out other sessions</Button>
                    </form>
                </SettingsSection>

                <SettingsSection
                    title="Delete account"
                    description="This cannot be undone. All information will be permanently removed."
                    noBorder
                >
                    <form className="flex items-start" onSubmit={handleDeleteAccount}>
                        <Button type="submit" variant="danger">
                            Yes, delete my account
                        </Button>
                    </form>
                </SettingsSection>
            </div>

            {/* Global toast */}
            {toastMessage && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
                    <Alert
                        type={toastType === 'success' ? 'success' : 'danger'}
                        title={toastType === 'success' ? 'Notification' : undefined}
                        message={toastMessage}
                        show={!!toastMessage}
                        onClose={() => setToastMessage(null)}
                    />
                </div>
            )}

            {/* click-away for avatar menu */}
            {showImageOptions && <div className="fixed inset-0 z-0" onClick={() => setShowImageOptions(false)} />}
        </>
    );
};

export default EditProfile;
