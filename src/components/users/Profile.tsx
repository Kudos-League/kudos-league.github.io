import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportUser } from '@/shared/api/mutations/users';

import { UserDTO, PostDTO, HandshakeDTO, EventDTO } from '@/shared/api/types';

import { useAuth } from '@/contexts/useAuth';
import ProfileHeader from '@/components/users/ProfileHeader';
import EditProfile from '@/components/users/edit/EditProfile';
import Handshakes from '@/components/handshakes/Handshakes';
import Spinner from '../common/Spinner';
import { apiMutate } from '@/shared/api/apiClient';
import { useBlockedUsers } from '@/contexts/useBlockedUsers';
import EventCard from '@/components/events/EventCard';
import PostList from '@/components/posts/PostsContainer';
import Button from '../common/Button';
import ReportPastGiftModal from '@/components/users/ReportPastGiftModal';
import InviteForm from './InviteForm';
import InviteManager from './InviteManager';

type FilterType = 'all' | 'posts' | 'events' | 'handshakes' | 'kudos';

type Props = {
    user: UserDTO;
    posts: PostDTO[];
    handshakes: HandshakeDTO[];
    events: EventDTO[];
    setUser?: (user: UserDTO) => void;
};

const Profile: React.FC<Props> = ({
    user,
    posts,
    handshakes,
    events,
    setUser
}) => {
    const { user: currentUser, token } = useAuth();
    const navigate = useNavigate();

    const isSelf = currentUser?.id === user.id;
    const [editing, setEditing] = useState(false);

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
    const [reportServerError, setReportServerError] = useState<string | null>(null);
    const { blockedUsers, loading: blockingLoading, block, unblock } = useBlockedUsers();

    const validateReportFiles = (files?: File[]) => {
        if (!files) return null;
        const MAX_FILE_COUNT = 4;
        const MAX_FILE_SIZE_MB = 10;
        if (files.length > MAX_FILE_COUNT) return `Max ${MAX_FILE_COUNT} files allowed.`;
        const tooLarge = files.find((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
        if (tooLarge) return `Files must be under ${MAX_FILE_SIZE_MB}MB.`;
        return null;
    };

    const handleReportImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Define available filters - show handshakes only for own profile
    const availableFilters: FilterType[] = isSelf
        ? ['all', 'posts', 'events', 'handshakes', 'kudos']
        : ['all', 'posts', 'events'];

    const [filter, setFilter] = useState<FilterType>('all');

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
        // eslint-disable-next-line brace-style
        catch (err) {
            console.error('Failed to create or get DM channel', err);
            alert('Failed to start a direct message. Please try again.');
        }
    };

    const getFilterLabel = (filterType: FilterType): string => {
        const labels: Record<FilterType, string> = {
            all: 'All',
            posts: 'Posts',
            events: 'Events',
            handshakes: 'Handshakes',
            kudos: 'Kudos history'
        };
        return labels[filterType];
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
        // eslint-disable-next-line brace-style
        catch (err) {
            console.error('Failed to reactivate user', err);
            alert('Failed to reactivate user.');
        }
    };

    // blockedUsers and loading come from the hook; hook implements fetching and optimistic updates

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

    const renderFilteredContent = () => {
        const showEmptyState =
            posts.length === 0 &&
            events.length === 0 &&
            (!isSelf || handshakes.length === 0);

        if (filter === 'kudos') {
            return (
                <React.Suspense
                    fallback={<Spinner text='Loading kudos history...' />}
                >
                    <KudosHistory />
                </React.Suspense>
            );
        }

        if (filter === 'handshakes') {
            return (
                <div className='grid gap-4'>
                    {handshakes.length === 0 ? (
                        <p className='text-center text-gray-500 dark:text-gray-400'>
                            No handshakes available.
                        </p>
                    ) : (
                        <Handshakes
                            handshakes={handshakes}
                            currentUserId={user.id}
                            showAll
                            onShowAll={() => {
                                console.log('Show all handshakes');
                            }}
                            showPostDetails
                        />
                    )}
                </div>
            );
        }

        if (filter === 'events') {
            return (
                <div className='grid gap-4 list-none'>
                    {events.length === 0 ? (
                        <p className='text-center text-gray-500 dark:text-gray-400'>
                            No events available.
                        </p>
                    ) : (
                        events.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))
                    )}
                </div>
            );
        }

        if (filter === 'posts') {
            return <PostList posts={posts} showHandshakeShortcut />;
        }

        return (
            <div className='space-y-8'>
                {/* Posts Section */}
                {posts.length > 0 && (
                    <div>
                        <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100'>
                            Posts ({posts.length})
                        </h3>
                        <PostList
                            posts={posts.slice(0, 3)}
                            showHandshakeShortcut
                        />
                        {posts.length > 3 && (
                            <div className='mt-4 text-center'>
                                <Button
                                    onClick={() => setFilter('posts')}
                                    variant='secondary'
                                    className='text-sm'
                                >
                                    View all {posts.length} posts
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Events Section */}
                {events.length > 0 && (
                    <div>
                        <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100'>
                            Events ({events.length})
                        </h3>
                        <div className='grid gap-4 list-none'>
                            {events.slice(0, 2).map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                        {events.length > 2 && (
                            <div className='mt-4 text-center'>
                                <Button
                                    onClick={() => setFilter('events')}
                                    variant='secondary'
                                    className='text-sm'
                                >
                                    View all {events.length} events
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Handshakes Section - Only for own profile */}
                {isSelf && handshakes.length > 0 && (
                    <div>
                        <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100'>
                            Handshakes ({handshakes.length})
                        </h3>
                        <Handshakes
                            handshakes={handshakes.slice(0, 2)}
                            currentUserId={user.id}
                            showAll={false}
                            onShowAll={() => setFilter('handshakes')}
                            showPostDetails
                        />
                    </div>
                )}

                {/* Empty state for 'All' */}
                {showEmptyState && (
                    <p className='text-center text-gray-500 dark:text-gray-400'>
                        No content available.
                    </p>
                )}
            </div>
        );
    };

    const KudosHistory = React.lazy(() => import('./KudosHistory'));

    return (
        <div className='max-w-5xl mx-auto'>
            <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg shadow-lg px-4 sm:px-6 lg:px-8 py-8 space-y-8'>
                <ProfileHeader
                    user={user}
                    userSettings={user.settings}
                    isSelf={isSelf}
                    onEditProfile={() => setEditing(true)}
                    onStartDM={handleStartDM}
                />

                {isSelf && currentUser?.admin && (
                    <InviteManager />
                )}

                {!isSelf && (
                    <div className='flex justify-center'>
                        <div className='flex gap-3'>
                            <Button
                                onClick={() => setShowPastGiftModal(true)}
                                className='!bg-teal-600 !text-white'
                            >
                                Log Past Gift
                            </Button>

                            <Button
                                onClick={() => setShowReportModal(true)}
                                className='!bg-red-600 !text-white'
                                variant='danger'
                            >
                                Report
                            </Button>
                            {currentUser && currentUser.id !== user.id && (
                                (blockedUsers ?? []).includes(user.id) ? (
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
                                )
                            )}
                            {currentUser?.admin && (
                                <>
                                    {!(user as any).banEndDate ? (
                                        <Button
                                            onClick={() => setShowBanModal(true)}
                                            className='!bg-red-700 !text-white'
                                            variant='danger'
                                        >
                                            Ban
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={async () => {
                                                if (!token) return alert('Missing auth token');
                                                const confirmUnban = window.confirm('Unban this user?');
                                                if (!confirmUnban) return;
                                                try {
                                                    await apiMutate(`/admin/users/${user.id}/unban`, 'post');
                                                    if (setUser) {
                                                        setUser({ ...(user as any), banEndDate: null } as any);
                                                    }
                                                    else {
                                                        console.warn('Unbanned user; setUser not provided so local UI may need refresh');
                                                    }
                                                    alert('User unbanned.');
                                                }
                                                catch (err: any) {
                                                    console.error('Failed to unban user', err);
                                                    alert(err?.message || 'Failed to unban user.');
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
                <InviteForm />
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

                {/* Filter Buttons */}
                <div className='flex flex-wrap gap-3 justify-center'>
                    {availableFilters.map((filterType) => {
                        const active = filter === filterType;
                        return (
                            <Button
                                key={filterType}
                                onClick={() => setFilter(filterType)}
                                className={[
                                    'px-4 py-2 rounded-md border transition-colors',
                                    active
                                        ? '!bg-blue-600 !text-white !border-blue-600'
                                        : '!bg-gray-100 dark:!bg-white/5 !text-gray-700 dark:!text-gray-200 !border-gray-200 dark:!border-white/10 hover:!bg-gray-200 dark:hover:!bg-white/10'
                                ].join(' ')}
                            >
                                {getFilterLabel(filterType)}
                            </Button>
                        );
                    })}
                </div>

                {/* Divider under filters */}
                <div className='border-t border-gray-200 dark:border-white/10' />

                {/* Filtered Content */}
                {renderFilteredContent()}

                <ReportPastGiftModal
                    open={showPastGiftModal}
                    onClose={() => setShowPastGiftModal(false)}
                    receiverID={user.id}
                />

                {showReportModal && (
                    <div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center'>
                        <div className='bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl text-gray-900 dark:text-gray-100'>
                            <h2 className='text-xl font-bold mb-2'>Report User</h2>
                            <p className='text-sm text-gray-600 dark:text-gray-300 mb-4'>
                                Why are you reporting this user?
                            </p>
                            <input
                                className='w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                placeholder='Short reason (e.g. harassment)'
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                            />
                            <textarea
                                className='w-full border border-gray-300 dark:border-gray-700 rounded p-2 mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                rows={4}
                                placeholder='Optional details...'
                                value={reportNotes}
                                onChange={(e) => setReportNotes(e.target.value)}
                            />
                            <label className='block text-sm font-semibold mb-2'>Attach Images (optional)</label>
                            <input
                                type='file'
                                accept='image/*'
                                multiple
                                onChange={handleReportImageUpload}
                                className='border border-gray-300 dark:border-gray-700 rounded-lg w-full px-3 py-2 mb-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                disabled={reportFiles.length >= 4}
                            />
                            {reportServerError && (
                                <div className='text-xs text-red-600 mb-2'>{reportServerError}</div>
                            )}
                            {reportFiles.length > 0 && (
                                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4'>
                                    {reportFiles.map((file, index) => (
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
                                                onClick={() => removeReportImage(index)}
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
                                            await reportMutation.mutateAsync({ id: user.id, reason: reportReason || 'Report', notes: reportNotes || undefined });
                                            alert('Report submitted. Thank you.');
                                            setShowReportModal(false);
                                            setReportReason('');
                                            setReportNotes('');
                                        }
                                        catch (err) {
                                            console.error('Failed to submit report', err);
                                            alert('Failed to submit report. Please try again.');
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
                                Provide an optional end date/time for the ban, or mark it as indefinite.
                            </p>

                            <label className='block text-sm font-medium mb-1'>End date (optional)</label>
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
                                    onChange={(e) => setBanIndefinite(e.target.checked)}
                                />
                                <span className='text-sm'>Indefinite ban</span>
                            </label>

                            {banServerError && (
                                <div className='text-xs text-red-600 mb-2'>{banServerError}</div>
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
                                        if (!currentUser?.admin || !user?.id) return;
                                        const confirmBan = window.confirm('Ban this user? This will immediately prevent them from logging in while the ban is active.');
                                        if (!confirmBan) return;
                                        try {
                                            const payload: Record<string, unknown> = {};
                                            if (banIndefinite) payload.indefinite = true;
                                            else if (banEndDate) payload.banEndDate = new Date(banEndDate).toISOString();
                                            await apiMutate(`/admin/users/${user.id}/ban`, 'post', payload);
                                            const endDate = banIndefinite ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10).toISOString() : (banEndDate ? new Date(banEndDate).toISOString() : null);
                                            if (setUser) {
                                                setUser({ ...(user as any), banEndDate: endDate } as any);
                                            }
                                            else {
                                                console.warn('User banned; setUser not provided so local UI may need refresh');
                                            }
                                            alert('User banned.');
                                            setShowBanModal(false);
                                            setBanEndDate('');
                                            setBanIndefinite(false);
                                        }
                                        catch (err: any) {
                                            console.error('Failed to ban user', err);
                                            setBanServerError(err?.message || 'Failed to ban user.');
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
