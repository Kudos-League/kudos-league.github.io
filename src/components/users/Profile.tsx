import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportUser } from '@/shared/api/mutations/users';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

import { UserDTO } from '@/shared/api/types';

import { useAuth } from '@/contexts/useAuth';
import ProfileHeader from '@/components/users/ProfileHeader';
import EditProfile from '@/components/users/edit/EditProfile';
import Spinner from '../common/Spinner';
import UserCard from '@/components/users/UserCard';
import { apiMutate, apiGet } from '@/shared/api/apiClient';
import { useBlockedUsers } from '@/contexts/useBlockedUsers';
import Button from '../common/Button';
import ReportPastGiftModal from '@/components/users/ReportPastGiftModal';
import InviteManager from './InviteManager';

type Props = {
    user: UserDTO;
    setUser?: (user: UserDTO) => void;
};

const Profile: React.FC<Props> = ({ user, setUser }) => {
    const { user: currentUser, token } = useAuth();
    const navigate = useNavigate();

    const isSelf = currentUser?.id === user.id;
    const showBackButton = true;
    const [editing, setEditing] = useState(false);
    const [showBlockedUsers, setShowBlockedUsers] = useState(false);

    const [showPastGiftModal, setShowPastGiftModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showBanModal, setShowBanModal] = useState(false);
    const [banEndDate, setBanEndDate] = useState<string>('');
    const [banIndefinite, setBanIndefinite] = useState<boolean>(false);
    const [banServerError, setBanServerError] = useState<string | null>(null);
    const [reportReason, setReportReason] = useState('');
    const [reportNotes, setReportNotes] = useState('');
    const reportMutation = useReportUser();
    const [reportFiles, setReportFiles] = useState<File[]>([]);
    const [reportServerError, setReportServerError] = useState<string | null>(
        null
    );
    const {
        blockedUsers,
        loading: blockingLoading,
        block,
        unblock
    } = useBlockedUsers();
    const [blockedUsersDetails, setBlockedUsersDetails] = useState<UserDTO[]>(
        []
    );

    // Fetch blocked users details
    React.useEffect(() => {
        if (!isSelf || !blockedUsers || blockedUsers.length === 0) {
            setBlockedUsersDetails([]);
            return;
        }

        const fetchBlockedUsers = async () => {
            try {
                const usersData = await Promise.all(
                    blockedUsers.map(async (userId) => {
                        try {
                            return await apiGet<UserDTO>(`/users/${userId}`);
                        }
                        catch (err) {
                            console.error(
                                `Failed to fetch user ${userId}`,
                                err
                            );
                            return null;
                        }
                    })
                );
                setBlockedUsersDetails(
                    usersData.filter((u): u is UserDTO => u !== null)
                );
            }
            catch (err) {
                console.error('Failed to fetch blocked users', err);
            }
        };

        fetchBlockedUsers();
    }, [blockedUsers, isSelf]);

    const validateReportFiles = (files?: File[]) => {
        if (!files) return null;
        const MAX_FILE_COUNT = 4;
        const MAX_FILE_SIZE_MB = 10;
        if (files.length > MAX_FILE_COUNT)
            return `Max ${MAX_FILE_COUNT} files allowed.`;
        const tooLarge = files.find(
            (f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024
        );
        if (tooLarge) return `Files must be under ${MAX_FILE_SIZE_MB}MB.`;
        return null;
    };

    const handleReportImageUpload = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = e.target.files;
        if (!files) return;
        const updated = [...reportFiles, ...Array.from(files)];
        const fileError = validateReportFiles(updated);
        if (fileError) return setReportServerError(fileError);
        setReportFiles(updated);
        setReportServerError(null);
        e.target.value = '';
    };

    const removeReportImage = (idx: number) => {
        setReportFiles((prev) => prev.filter((_, i) => i !== idx));
    };

    const createImagePreview = (f: File) => URL.createObjectURL(f);

    const handleStartDM = async () => {
        if (!currentUser?.id || !user?.id) return;
        try {
            await apiMutate('/channels', 'post', {
                name: `DM: User ${currentUser.id} & User ${user.id}`,
                channelType: 'dm',
                userIDs: [currentUser.id, user.id]
            });
            navigate(`/dms/${user.id}`);
        }
        catch (err) {
            // eslint-disable-next-line brace-style
            console.error('Failed to create or get DM channel', err);
            alert('Failed to start a direct message. Please try again.');
        }
    };

    const handleReactivate = async () => {
        if (!currentUser?.admin || !user?.id) return;
        const confirmReactivate = window.confirm('Reactivate this account?');
        if (!confirmReactivate) return;
        try {
            if (!token) throw new Error('Missing auth token');
            const updated = (await apiMutate(
                `/users/${user.id}/reactivate`,
                'patch'
            )) as UserDTO;
            setUser?.(updated);
            alert('User reactivated.');
        }
        catch (err) {
            // eslint-disable-next-line brace-style
            console.error('Failed to reactivate user', err);
            alert('Failed to reactivate user.');
        }
    };

    if (editing) {
        return (
            <EditProfile
                targetUser={user}
                userSettings={user.settings}
                onClose={() => setEditing(false)}
                setTargetUser={setUser}
            />
        );
    }

    return (
        <div className='max-w-5xl mx-auto'>
            {showBackButton && (
                <button
                    onClick={() => navigate(-1)}
                    className='mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm'
                    aria-label='Go back'
                >
                    <ArrowLeftIcon className='w-5 h-5' />
                    <span className='font-medium'>Back</span>
                </button>
            )}
            <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg shadow-lg px-4 sm:px-6 lg:px-8 py-8 space-y-6'>
                <ProfileHeader
                    user={user}
                    userSettings={user.settings}
                    isSelf={isSelf}
                    onEditProfile={() => setEditing(true)}
                    onStartDM={handleStartDM}
                />

                {isSelf && currentUser?.admin && <InviteManager />}

                {/* Log Past Gift button - available for all users on their own profile */}
                {/* {isSelf && (
                        <div className='flex flex-col items-center gap-2'>
                            <Button
                                onClick={() => setShowPastGiftModal(true)}
                                className='!bg-brand-600 !text-white'
                            >
                                Log Past Gift
                            </Button>
                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                Post a good deed that you made previously
                            </p>
                        </div>
                    )} */}

                {!isSelf && (
                    <div className='flex justify-center'>
                        <div className='flex gap-3'>
                            <Button
                                onClick={() => setShowReportModal(true)}
                                className='!bg-red-600 !text-white'
                                variant='danger'
                            >
                                    Report
                            </Button>
                            {currentUser &&
                                    currentUser.id !== user.id &&
                                    ((blockedUsers ?? []).includes(user.id) ? (
                                        <Button
                                            onClick={async () => {
                                                if (blockingLoading) return;
                                                try {
                                                    await unblock(user.id);
                                                }
                                                catch (err) {
                                                    // noop
                                                }
                                            }}
                                            variant='secondary'
                                        >
                                            Unblock
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={async () => {
                                                if (blockingLoading) return;
                                                try {
                                                    await block(user.id);
                                                }
                                                catch (err) {
                                                    // noop - hook will rollback/refresh
                                                }
                                            }}
                                            className='!bg-red-600 !text-white'
                                        >
                                            Block
                                        </Button>
                                    ))}
                            {currentUser?.admin && (
                                <>
                                    {!(user as any).banEndDate ? (
                                        <Button
                                            onClick={() =>
                                                setShowBanModal(true)
                                            }
                                            className='!bg-red-700 !text-white'
                                            variant='danger'
                                        >
                                                Ban
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={async () => {
                                                if (!token)
                                                    return alert(
                                                        'Missing auth token'
                                                    );
                                                const confirmUnban =
                                                        window.confirm(
                                                            'Unban this user?'
                                                        );
                                                if (!confirmUnban) return;
                                                try {
                                                    await apiMutate(
                                                        `/admin/users/${user.id}/unban`,
                                                        'post'
                                                    );
                                                    if (setUser) {
                                                        setUser({
                                                            ...(user as any),
                                                            banEndDate: null
                                                        } as any);
                                                    }
                                                    else {
                                                        console.warn(
                                                            'Unbanned user; setUser not provided so local UI may need refresh'
                                                        );
                                                    }
                                                    alert('User unbanned.');
                                                }
                                                catch (err: any) {
                                                    console.error(
                                                        'Failed to unban user',
                                                        err
                                                    );
                                                    alert(
                                                        err?.message ||
                                                                'Failed to unban user.'
                                                    );
                                                }
                                            }}
                                            className='!bg-green-600 !text-white'
                                            variant='primary'
                                        >
                                                Unban
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
                {/* <InviteForm /> */}
                {currentUser?.admin && !isSelf && user.deactivatedAt && (
                    <div className='flex justify-center'>
                        <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-md px-4 py-3 flex items-center gap-3'>
                            <span>This account is deactivated.</span>
                            <button
                                className='px-3 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700'
                                onClick={handleReactivate}
                            >
                                    Reactivate
                            </button>
                        </div>
                    </div>
                )}

                {/* Divider under header */}
                <div className='border-t border-gray-200 dark:border-white/10' />

                {/* Profession */}
                {user.settings?.profession && (
                    <div className='flex justify-center'>
                        <div className='bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-lg p-4 max-w-md w-full text-center'>
                            <span className='text-sm font-semibold text-gray-700 dark:text-gray-200'>
                                    Profession
                            </span>
                            <p className='mt-1 text-gray-700 dark:text-gray-300 text-sm'>
                                {user.settings.profession}
                            </p>
                        </div>
                    </div>
                )}

                {/* Blocked Users Section - Only for own profile */}
                {isSelf && (
                    <div className='bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden'>
                        <button
                            onClick={() =>
                                setShowBlockedUsers(!showBlockedUsers)
                            }
                            className='w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-white/5 transition-colors'
                        >
                            <div className='flex items-center gap-2'>
                                <span className='text-red-600 dark:text-red-400 text-lg'>
                                        🔐
                                </span>
                                <span className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                                        Blocked Users
                                </span>
                                {blockedUsersDetails.length > 0 && (
                                    <span className='px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full'>
                                        {blockedUsersDetails.length}
                                    </span>
                                )}
                            </div>
                            <svg
                                className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${showBlockedUsers ? 'rotate-180' : ''}`}
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M19 9l-7 7-7-7'
                                />
                            </svg>
                        </button>

                        {showBlockedUsers && (
                            <div className='border-t border-gray-200 dark:border-white/10 p-4'>
                                {blockingLoading ? (
                                    <div className='text-center py-4'>
                                        <Spinner text='Loading blocked users...' />
                                    </div>
                                ) : blockedUsersDetails.length === 0 ? (
                                    <p className='text-center text-gray-500 dark:text-gray-400 py-4 text-sm'>
                                            No blocked users
                                    </p>
                                ) : (
                                    <div className='space-y-3'>
                                        {blockedUsersDetails.map(
                                            (blockedUser) => (
                                                <div
                                                    key={blockedUser.id}
                                                    className='flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'
                                                >
                                                    <div className='flex items-center gap-3 flex-1 min-w-0'>
                                                        <UserCard
                                                            user={blockedUser}
                                                        />
                                                    </div>
                                                    <Button
                                                        onClick={async () => {
                                                            if (blockingLoading)
                                                                return;
                                                            try {
                                                                await unblock(
                                                                    blockedUser.id
                                                                );
                                                            }
                                                            catch (err) {
                                                                console.error(
                                                                    'Failed to unblock user',
                                                                    err
                                                                );
                                                            }
                                                        }}
                                                        variant='secondary'
                                                        className='text-xs shrink-0 ml-3'
                                                        disabled={
                                                            blockingLoading
                                                        }
                                                    >
                                                            Unblock
                                                    </Button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <ReportPastGiftModal
                    open={showPastGiftModal}
                    onClose={() => setShowPastGiftModal(false)}
                    receiverID={user.id}
                />

                {showReportModal && (
                    <div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center'>
                        <div className='bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl text-gray-900 dark:text-gray-100'>
                            <h2 className='text-xl font-bold mb-2'>
                                Report User
                            </h2>
                            <p className='text-sm text-gray-600 dark:text-gray-300 mb-4'>
                                Why are you reporting this user?
                            </p>
                            <input
                                className='w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                placeholder='Short reason (e.g. harassment)'
                                value={reportReason}
                                onChange={(e) =>
                                    setReportReason(e.target.value)
                                }
                            />
                            <textarea
                                className='w-full border border-gray-300 dark:border-gray-700 rounded p-2 mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 overflow-y-auto'
                                style={{
                                    WebkitOverflowScrolling: 'touch',
                                    touchAction: 'pan-y'
                                }}
                                rows={4}
                                placeholder='Optional details...'
                                value={reportNotes}
                                onChange={(e) => setReportNotes(e.target.value)}
                            />
                            <label className='block text-sm font-semibold mb-2'>
                                Attach Images (optional)
                            </label>
                            <input
                                type='file'
                                accept='image/*'
                                multiple
                                onChange={handleReportImageUpload}
                                className='border border-gray-300 dark:border-gray-700 rounded-lg w-full px-3 py-2 mb-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                disabled={reportFiles.length >= 4}
                            />
                            {reportServerError && (
                                <div className='text-xs text-red-600 mb-2'>
                                    {reportServerError}
                                </div>
                            )}
                            {reportFiles.length > 0 && (
                                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4'>
                                    {reportFiles.map((file, index) => (
                                        <div
                                            key={index}
                                            className='relative group'
                                        >
                                            <img
                                                src={createImagePreview(file)}
                                                alt={`Preview ${index + 1}`}
                                                className='w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600'
                                            />
                                            <Button
                                                type='button'
                                                shape='circle'
                                                variant='danger'
                                                onClick={() =>
                                                    removeReportImage(index)
                                                }
                                                className='absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-sm'
                                                title='Remove image'
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className='flex justify-end gap-2'>
                                <Button
                                    onClick={() => setShowReportModal(false)}
                                    variant='secondary'
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (!user?.id) return;
                                        try {
                                            await reportMutation.mutateAsync({
                                                id: user.id,
                                                reason:
                                                    reportReason || 'Report',
                                                notes: reportNotes || undefined
                                            });
                                            alert(
                                                'Report submitted. Thank you.'
                                            );
                                            setShowReportModal(false);
                                            setReportReason('');
                                            setReportNotes('');
                                        }
                                        catch (err) {
                                            console.error(
                                                'Failed to submit report',
                                                err
                                            );
                                            alert(
                                                'Failed to submit report. Please try again.'
                                            );
                                        }
                                    }}
                                    variant='danger'
                                >
                                    Submit
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {showBanModal && (
                    <div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center'>
                        <div className='bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl text-gray-900 dark:text-gray-100'>
                            <h2 className='text-xl font-bold mb-2'>Ban User</h2>
                            <p className='text-sm text-gray-600 dark:text-gray-300 mb-4'>
                                Provide an optional end date/time for the ban,
                                or mark it as indefinite.
                            </p>

                            <label className='block text-sm font-medium mb-1'>
                                End date (optional)
                            </label>
                            <input
                                type='datetime-local'
                                value={banEndDate}
                                onChange={(e) => setBanEndDate(e.target.value)}
                                disabled={banIndefinite}
                                className='w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            />

                            <label className='flex items-center gap-2 mb-3'>
                                <input
                                    type='checkbox'
                                    checked={banIndefinite}
                                    onChange={(e) =>
                                        setBanIndefinite(e.target.checked)
                                    }
                                />
                                <span className='text-sm'>Indefinite ban</span>
                            </label>

                            {banServerError && (
                                <div className='text-xs text-red-600 mb-2'>
                                    {banServerError}
                                </div>
                            )}

                            <div className='flex justify-end gap-2'>
                                <Button
                                    onClick={() => {
                                        setShowBanModal(false);
                                        setBanEndDate('');
                                        setBanIndefinite(false);
                                        setBanServerError(null);
                                    }}
                                    variant='secondary'
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (!currentUser?.admin || !user?.id)
                                            return;
                                        const confirmBan = window.confirm(
                                            'Ban this user? This will immediately prevent them from logging in while the ban is active.'
                                        );
                                        if (!confirmBan) return;
                                        try {
                                            const payload: Record<
                                                string,
                                                unknown
                                            > = {};
                                            if (banIndefinite)
                                                payload.indefinite = true;
                                            else if (banEndDate)
                                                payload.banEndDate = new Date(
                                                    banEndDate
                                                ).toISOString();
                                            await apiMutate(
                                                `/admin/users/${user.id}/ban`,
                                                'post',
                                                payload
                                            );
                                            const endDate = banIndefinite
                                                ? new Date(
                                                    Date.now() +
                                                          1000 *
                                                              60 *
                                                              60 *
                                                              24 *
                                                              365 *
                                                              10
                                                ).toISOString()
                                                : banEndDate
                                                    ? new Date(
                                                        banEndDate
                                                    ).toISOString()
                                                    : null;
                                            if (setUser) {
                                                setUser({
                                                    ...(user as any),
                                                    banEndDate: endDate
                                                } as any);
                                            }
                                            else {
                                                console.warn(
                                                    'User banned; setUser not provided so local UI may need refresh'
                                                );
                                            }
                                            alert('User banned.');
                                            setShowBanModal(false);
                                            setBanEndDate('');
                                            setBanIndefinite(false);
                                        }
                                        catch (err: any) {
                                            console.error(
                                                'Failed to ban user',
                                                err
                                            );
                                            setBanServerError(
                                                err?.message ||
                                                    'Failed to ban user.'
                                            );
                                        }
                                    }}
                                    variant='danger'
                                >
                                    Confirm Ban
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
