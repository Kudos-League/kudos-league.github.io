import React from 'react';
import UserCard from '../users/UserCard';
import type { PostDTO, UserDTO } from '@/shared/api/types';

type Report = {
    id: number | string;
    user?: UserDTO | null;
    userID?: number | null;
    post?: PostDTO | null;
    postID?: number | string | null;
    targetUser?: UserDTO | null;
    targetUserID?: number | null;
    reason?: string | null;
    status?: string | null;
    createdAt?: string | Date;
    rewardKudos?: number | null;
};

export default function ReportCard({
    report,
    children
}: {
    report: Report;
    children?: React.ReactNode;
}) {
    const reporter = report.user ?? undefined;
    const target = report.targetUser ?? undefined;
    const postTitle =
        report.post?.title ?? (report.postID ? `#${report.postID}` : undefined);

    return (
        <div className='p-3 border rounded bg-white/50 dark:bg-black/40'>
            <div className='flex justify-between items-start'>
                <div className='min-w-0'>
                    <div className='flex items-center gap-3'>
                        <UserCard user={reporter} />
                    </div>

                    {target ? (
                        <div className='mt-2 font-semibold'>
                            <span>Reported user: </span>
                            <span className='inline-block align-middle'>
                                <UserCard user={target} />
                            </span>
                        </div>
                    ) : postTitle ? (
                        <div className='mt-2 font-semibold'>
                            <span>Post: </span>
                            <span className='text-sm'>{postTitle}</span>
                        </div>
                    ) : null}

                    <div className='mt-2 text-sm text-gray-800 dark:text-gray-200'>
                        {report.reason ?? (
                            <em className='text-gray-500'>
                                No reason provided
                            </em>
                        )}
                    </div>

                    <div className='mt-2 text-sm flex flex-wrap gap-3'>
                        {report.status && (
                            <span className='text-sm text-gray-600'>
                                Status: {report.status}
                            </span>
                        )}
                        <span className='text-sm text-gray-600'>
                            Reward kudos:{' '}
                            {typeof report.rewardKudos === 'number'
                                ? report.rewardKudos
                                : '—'}
                        </span>
                    </div>
                </div>

                {children ? (
                    <div className='ml-4 flex flex-col gap-2'>{children}</div>
                ) : null}
            </div>

            {report.post?.body && (
                <div className='mt-3 text-sm italic text-gray-600'>
                    {report.post.body}
                </div>
            )}
        </div>
    );
}
