import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { apiGet } from '@/shared/api/apiClient';
import ReportsDashboard from '@/components/admin/ReportsDashboard';
import FeedbackDashboard from '@/components/admin/FeedbackDashboard';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import Button from '@/components/common/Button';

export default function AdminDashboard() {
    const { user } = useAuth();

    const [tab, setTab] = useState<'reports' | 'feedback' | 'analytics'>('reports');

    const [reports, setReports] = useState<any[]>([]);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!user?.admin) {
                setError('Admin access required.');
                setLoading(false);
                return;
            }

            try {
                const [r, f] = await Promise.all([
                    apiGet<any>('/admin/reports'),
                    apiGet<any>('/feedback')
                ]);
                setReports(r ?? []);
                setFeedbacks(f ?? []);
            }
            catch (err) {
                console.error(err);
                setError('Failed to load admin data.');
            }
            finally {
                setLoading(false);
            }
        };

        load();
    }, [user]);

    if (loading) {
        return <div className='text-center mt-10 text-gray-500'>Loading…</div>;
    }

    if (error) {
        return <p className='text-red-600'>{error}</p>;
    }

    return (
        <div className='max-w-5xl mx-auto p-6'>
            <div className='flex items-center justify-between mb-5'>
                <h1 className='text-2xl font-bold'>Admin</h1>
                <div className='inline-flex gap-2'>
                    <Button
                        variant={tab === 'reports' ? 'primary' : 'ghost'}
                        onClick={() => setTab('reports')}
                    >
                        Reports
                    </Button>
                    <Button
                        variant={tab === 'feedback' ? 'primary' : 'ghost'}
                        onClick={() => setTab('feedback')}
                    >
                        Feedback
                    </Button>
                    <Button
                        variant={tab === 'analytics' ? 'primary' : 'ghost'}
                        onClick={() => setTab('analytics')}
                    >
                        Analytics
                    </Button>
                </div>
            </div>

            {tab === 'reports' && (
                <ReportsDashboard reports={reports} setReports={setReports} />
            )}
            {tab === 'feedback' && (
                <FeedbackDashboard
                    feedbacks={feedbacks}
                    setFeedbacks={setFeedbacks}
                />
            )}
            {tab === 'analytics' && (
                <AdminAnalytics />
            )}
        </div>
    );
}
