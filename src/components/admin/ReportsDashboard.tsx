import { useAuth } from '@/contexts/useAuth';
import { apiMutate } from '@/shared/api/apiClient';
import React, { useState } from 'react';
import Button from '../common/Button';
import RewardKudosModal from './RewardKudosModal';
import UserCard from '../users/UserCard';

type Props = {
    reports: any[];
    setReports: React.Dispatch<React.SetStateAction<any[]>>;
};

export default function Dashboard({ reports, setReports }: Props) {
    // token is no longer passed per-request; setAuthToken handles headers globally.
    useAuth();
    const [rewardOpenFor, setRewardOpenFor] = useState<number | null>(null);

    const handleDeleteReport = async (reportID: number) => {
        try {
            await apiMutate<void, void>(`/admin/reports/${reportID}`, 'delete');
            setReports((prev) => prev.filter((r) => r.id !== reportID));
        }
        catch (err) {
            console.error('Failed to delete report:', err);
            alert('Error deleting report');
        }
    };

    const handleUpdateStatus = async (
        reportID: number,
        status: 'ignored' | 'resolved'
    ) => {
        try {
            await apiMutate<void, { status: string }>(
                `/admin/reports/${reportID}`,
                'put',
                { status }
            );
            setReports((prev: any[]) =>
                prev.map((r) => (r.id === reportID ? { ...r, status } : r))
            );
        }
        catch (err) {
            console.error('Failed to update report status:', err);
            alert('Error updating report');
        }
    };

    const handleResolveWithReward = async (
        reportID: number,
        rewardKudos: number
    ) => {
        try {
            await apiMutate<void, { rewardKudos: number }>(
                `/admin/reports/${reportID}/resolve`,
                'put',
                { rewardKudos }
            );
            setReports((prev) =>
                prev.map((r) =>
                    r.id === reportID
                        ? { ...r, status: 'resolved', rewardKudos }
                        : r
                )
            );
        }
        catch (err) {
            console.error('Failed to resolve report:', err);
            alert('Error resolving report');
        }
    };

    return (
        <div
            className='max-w-4xl mx-auto p-6
                       light:text-gray-900 dark:text-neutral-100'
        >
            <h1 className='text-2xl font-bold mb-4'>Reported Posts</h1>

            {reports.length === 0 ? (
                <p className='light:text-gray-600 dark:text-neutral-400'>
                    No reports found.
                </p>
            ) : (
                <div className='space-y-4'>
                    {reports.map((report) => (
                        <div
                            key={report.id}
                            className='p-4 rounded shadow-sm
                                       light:bg-gray-50 light:border light:border-gray-200
                                       dark:bg-neutral-800/60 dark:border dark:border-neutral-700'
                        >
                            <div className='flex justify-between items-start gap-4'>
                                <div>
                                    <p className='text-sm light:text-gray-600 dark:text-neutral-300'>
                                        Reported by{' '}
                                        <span className='font-medium'>
                                            <UserCard user={report.user} />
                                        </span>
                                    </p>
                                    <p className='font-semibold'>
                                        Post ID:{' '}
                                        {report.postId ?? report.postID}
                                    </p>
                                    <p className='light:text-gray-700 dark:text-neutral-200'>
                                        {report.reason}
                                    </p>
                                    <div className='mt-1 text-sm flex flex-wrap gap-3'>
                                        {report.status && (
                                            <span className='light:text-gray-600 dark:text-neutral-300'>
                                                Status: {report.status}
                                            </span>
                                        )}
                                        <span className='light:text-gray-600 dark:text-neutral-300'>
                                            Reward kudos:{' '}
                                            {typeof report.rewardKudos ===
                                            'number'
                                                ? report.rewardKudos
                                                : '—'}
                                        </span>
                                    </div>
                                </div>

                                <div className='flex gap-2 text-sm'>
                                    <Button
                                        onClick={() =>
                                            handleUpdateStatus(
                                                report.id,
                                                'ignored'
                                            )
                                        }
                                    >
                                        Ignore
                                    </Button>
                                    <Button
                                        variant='success'
                                        onClick={() =>
                                            setRewardOpenFor(report.id)
                                        }
                                    >
                                        Resolve
                                    </Button>
                                    <Button
                                        variant='danger'
                                        onClick={() =>
                                            handleDeleteReport(report.id)
                                        }
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>

                            {report.post && (
                                <div className='mt-3 text-sm'>
                                    <p className='italic light:text-gray-700 dark:text-neutral-200'>
                                        Post Title: {report.post.title}
                                    </p>
                                    <p className='light:text-gray-600 dark:text-neutral-300'>
                                        {report.post.body}
                                    </p>
                                </div>
                            )}

                            <RewardKudosModal
                                open={rewardOpenFor === report.id}
                                reportId={report.id}
                                current={report.rewardKudos ?? null}
                                onClose={() => setRewardOpenFor(null)}
                                onSave={(k) =>
                                    handleResolveWithReward(report.id, k)
                                }
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
