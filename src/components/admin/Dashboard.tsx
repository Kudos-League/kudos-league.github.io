import { useAuth } from '@/contexts/useAuth';
import { deleteReport, updateReportStatus } from '@/shared/api/actions';
import React from 'react';
import Button from '../common/Button';

type Props = {
    reports: any[];
    setReports: React.Dispatch<React.SetStateAction<any[]>>;
};

export default function Dashboard({ reports, setReports }: Props) {
    const { token } = useAuth();

    const handleDeleteReport = async (reportID: number) => {
        try {
            await deleteReport(reportID, token);
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
            await updateReportStatus(reportID, status, token);
            setReports((prev: any[]) =>
                prev.map((r) => (r.id === reportID ? { ...r, status } : r))
            );
        }
        catch (err) {
            console.error('Failed to update report status:', err);
            alert('Error updating report');
        }
    };

    return (
        <div className='max-w-4xl mx-auto p-6'>
            <h1 className='text-2xl font-bold mb-4'>Reported Posts</h1>

            {reports.length === 0 ? (
                <p className='text-gray-600'>No reports found.</p>
            ) : (
                <div className='space-y-4'>
                    {reports.map((report) => (
                        <div
                            key={report.id}
                            className='p-4 border rounded bg-gray-100 shadow-sm'
                        >
                            <div className='flex justify-between items-start gap-4'>
                                <div>
                                    <p className='font-semibold'>
                                        Post ID: {report.postId}
                                    </p>
                                    <p>Reason: {report.reason}</p>
                                    {report.status && (
                                        <p className='text-sm text-gray-500 mt-1'>
                                            Status: {report.status}
                                        </p>
                                    )}
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
                                            handleUpdateStatus(
                                                report.id,
                                                'resolved'
                                            )
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
                                    <p className='italic'>
                                        Post Title: {report.post.title}
                                    </p>
                                    <p>{report.post.body}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
