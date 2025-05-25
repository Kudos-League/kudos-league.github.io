import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    deleteReport,
    getReports,
    updateReportStatus
} from '@/shared/api/actions';

export default function AdminDashboard() {
    const { token, user } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleDeleteReport = async (reportID: number) => {
        try {
            await deleteReport(reportID, token!);
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
            await updateReportStatus(reportID, status, token!);
            setReports((prev) =>
                prev.map((r) => (r.id === reportID ? { ...r, status } : r))
            );
        }
        catch (err) {
            console.error('Failed to update report status:', err);
            alert('Error updating report');
        }
    };

    useEffect(() => {
        const fetchReports = async () => {
            if (!token || !user?.admin) {
                setError('Admin access required.');
                setLoading(false);
                return;
            }

            try {
                const data = await getReports(token);
                setReports(data);
            }
            catch (err) {
                console.error(err);
                setError('Failed to load reports.');
            }
            finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [token, user]);

    if (loading)
        return (
            <div className='text-center mt-10 text-gray-500'>
                Loading reports...
            </div>
        );
    if (error) return <p className='text-red-600'>{error}</p>;

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
                                    <button
                                        onClick={() =>
                                            handleUpdateStatus(
                                                report.id,
                                                'ignored'
                                            )
                                        }
                                        className='text-orange-600 hover:underline'
                                    >
                                        Ignore
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleUpdateStatus(
                                                report.id,
                                                'resolved'
                                            )
                                        }
                                        className='text-green-600 hover:underline'
                                    >
                                        Resolve
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleDeleteReport(report.id)
                                        }
                                        className='text-red-600 hover:underline'
                                    >
                                        Delete
                                    </button>
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
