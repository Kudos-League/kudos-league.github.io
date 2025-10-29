import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { apiGet } from '@/shared/api/apiClient';
import ReportsDashboard from '@/components/admin/ReportsDashboard';
import FeedbackDashboard from '@/components/admin/FeedbackDashboard';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import UserCard from '@/components/users/UserCard';
import Tippy from '@tippyjs/react/headless';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import AdminReportModal from '@/components/admin/AdminReportModal';
import Button from '@/components/common/Button';
import { FeedbackDTO } from '@/shared/api/types';

export default function AdminDashboard() {
    const { user } = useAuth();

    const [tab, setTab] = useState<'reports' | 'feedback' | 'analytics' | 'suspicious'>('reports');

    const [reports, setReports] = useState<any[]>([]);
    const [feedbacks, setFeedbacks] = useState<FeedbackDTO[]>([]);

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
                    apiGet<FeedbackDTO[]>('/feedback')
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

    const [adminReportOpenFor, setAdminReportOpenFor] = useState<number | null>(null);

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
                    <Button
                        variant={tab === 'suspicious' ? 'primary' : 'ghost'}
                        onClick={() => setTab('suspicious')}
                    >
                        Suspicious
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
            {tab === 'suspicious' && (
                <div>
                    <h2 className='text-xl font-semibold mb-3'>Suspicious IP groups</h2>
                    <SuspiciousPanel onInvestigate={(id: number) => setAdminReportOpenFor(id)} />
                </div>
            )}

            <AdminReportModal open={!!adminReportOpenFor} userID={adminReportOpenFor} onClose={() => setAdminReportOpenFor(null)} />
        </div>
    );
}

function SuspiciousPanel({ onInvestigate }: { onInvestigate?: (userID: number) => void }) {
    const { user } = useAuth();
    const [groups, setGroups] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.admin) return;
        setLoading(true);
        apiGet<any[]>('/admin/suspicious')
            .then((r) => setGroups(r || []))
            .catch((e) => {
                console.error('Failed to load suspicious groups', e);
                setError('Failed to load suspicious groups');
            })
            .finally(() => setLoading(false));
    }, [user]);

    if (!user?.admin) return <p className='text-red-600'>Admin access required.</p>;
    if (loading) return <div className='text-gray-500'>Loading…</div>;
    if (error) return <p className='text-red-600'>{error}</p>;
    if (!groups || groups.length === 0) return <p>No suspicious groups found.</p>;

    return (
        <div className='space-y-3'>
            {groups.map((g) => (
                <div key={g.ipAddress} className='p-3 border rounded'>
                    <div className='flex items-center justify-between mb-2'>
                        <div className='font-mono text-sm'>IP: {g.ipAddress}</div>
                        <div className='text-sm text-gray-600'>Count: {g.userCount}</div>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                        {g.users?.map((u: any) => (
                            <div key={u.id} className='col-span-1 flex items-center justify-between p-2 border rounded'>
                                <div className='flex items-center gap-3'>
                                    <UserCard user={u} />
                                </div>
                                <div>
                                    <Tippy
                                        placement='top'
                                        delay={[100, 0]}
                                        render={(attrs) => (
                                            <div {...attrs} className='bg-black text-white text-xs rounded px-2 py-1'>Open admin report</div>
                                        )}
                                    >
                                        <button
                                            aria-label={`Investigate user ${u.username ?? u.id}`}
                                            className='ml-2 p-1 rounded hover:bg-red-50 active:bg-red-100'
                                            onClick={() => onInvestigate && onInvestigate(u.id)}
                                        >
                                            <ExclamationTriangleIcon className='h-5 w-5 text-red-600' />
                                        </button>
                                    </Tippy>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
