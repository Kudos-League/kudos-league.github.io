import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { getReports } from '@/shared/api/actions';
import Dashboard from '@/components/admin/Dashboard';

export default function AdminDashboard() {
    const { token, user } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    if (loading) {
        return (
            <div className='text-center mt-10 text-gray-500'>
                Loading reports...
            </div>
        );
    }

    if (error) {
        return <p className='text-red-600'>{error}</p>;
    }

    return <Dashboard reports={reports} setReports={setReports} />;
}
