import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import ReportCard from './ReportCard';
import { apiGet } from '@/shared/api/apiClient';
import { useAuth } from '@/contexts/useAuth';
import { routes } from '@/routes';

type LoginAudit = {
    ipAddress: string;
    region?: string | null;
    country?: string | null;
    userAgent?: string | null;
    createdAt: string | Date;
};
type SuspectedLinkedUser = {
    id: number;
    username?: string | null;
    email?: string | null;
    admin?: boolean;
    ips: string[];
    lastSeen?: string | Date | null;
};
type HandshakeView = {
    id: number;
    postID?: number;
    senderID: number;
    receiverID: number;
    type?: string;
    status?: string;
    createdAt?: string | Date;
};

type Paged<T> = { data: T[]; nextCursor?: string | number; limit: number };

export default function AdminReportModal({
    open,
    onClose,
    userID
}: {
    open: boolean;
    onClose: () => void;
    userID: number | null;
}) {
    const navigate = useNavigate();
    const { startMasquerade } = useAuth();
    const [activeTab, setActiveTab] = useState<
        'login' | 'suspects' | 'handshakes' | 'reports'
    >('login');
    const [masqueradeLoading, setMasqueradeLoading] = useState(false);
    const [masqueradeError, setMasqueradeError] = useState<string | null>(null);

    const [loginAudits, setLoginAudits] = useState<LoginAudit[]>([]);
    const [loginNext, setLoginNext] = useState<string | number | undefined>(
        undefined
    );
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    const [suspects, setSuspects] = useState<SuspectedLinkedUser[]>([]);
    const [suspectsNext, setSuspectsNext] = useState<
        string | number | undefined
    >(undefined);
    const [suspectsLoading, setSuspectsLoading] = useState(false);
    const [suspectsError, setSuspectsError] = useState<string | null>(null);

    const [handshakes, setHandshakes] = useState<HandshakeView[]>([]);
    const [handshakesNext, setHandshakesNext] = useState<
        string | number | undefined
    >(undefined);
    const [handshakesLoading, setHandshakesLoading] = useState(false);
    const [handshakesError, setHandshakesError] = useState<string | null>(null);

    const limit = 5;
    const [reports, setReports] = useState<any[]>([]);
    const [reportsNext, setReportsNext] = useState<string | number | undefined>(
        undefined
    );
    const [reportsLoading, setReportsLoading] = useState(false);
    const [reportsError, setReportsError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setLoginAudits([]);
        setLoginNext(undefined);
        setLoginError(null);
        setSuspects([]);
        setSuspectsNext(undefined);
        setSuspectsError(null);
        setHandshakes([]);
        setHandshakesNext(undefined);
        setHandshakesError(null);
        if (userID) {
            if (activeTab === 'login') loadMoreLogin(userID);
            if (activeTab === 'suspects') loadMoreSuspects(userID);
            if (activeTab === 'handshakes') loadMoreHandshakes(userID);
            if (activeTab === 'reports') loadMoreReports(userID);
        }
    }, [open, userID]);

    useEffect(() => {
        if (!open || !userID) return;
        if (activeTab === 'login' && loginAudits.length === 0)
            loadMoreLogin(userID);
        if (activeTab === 'suspects' && suspects.length === 0)
            loadMoreSuspects(userID);
        if (activeTab === 'handshakes' && handshakes.length === 0)
            loadMoreHandshakes(userID);
        if (activeTab === 'reports' && reports.length === 0)
            loadMoreReports(userID);
    }, [activeTab, open, userID]);

    async function loadMoreLogin(id: number) {
        setLoginLoading(true);
        setLoginError(null);
        try {
            const q = loginNext
                ? `?limit=${limit}&cursor=${encodeURIComponent(String(loginNext))}`
                : `?limit=${limit}`;
            const res = await apiGet<Paged<LoginAudit>>(
                `/admin/users/${id}/login-audits${q}`
            );
            if (res?.data) setLoginAudits((s) => [...s, ...res.data]);
            setLoginNext(res?.nextCursor);
        }
        catch (e) {
            setLoginError('Failed to load login audits');
        }
        finally {
            setLoginLoading(false);
        }
    }

    async function loadMoreSuspects(id: number) {
        setSuspectsLoading(true);
        setSuspectsError(null);
        try {
            const q = suspectsNext
                ? `?limit=${limit}&cursor=${encodeURIComponent(String(suspectsNext))}`
                : `?limit=${limit}`;
            const res = await apiGet<Paged<SuspectedLinkedUser>>(
                `/admin/users/${id}/suspected-linked${q}`
            );
            if (res?.data) setSuspects((s) => [...s, ...res.data]);
            setSuspectsNext(res?.nextCursor);
        }
        catch (e) {
            setSuspectsError('Failed to load suspected linked users');
        }
        finally {
            setSuspectsLoading(false);
        }
    }

    async function loadMoreHandshakes(id: number) {
        setHandshakesLoading(true);
        setHandshakesError(null);
        try {
            const q = handshakesNext
                ? `?limit=${limit}&cursor=${encodeURIComponent(String(handshakesNext))}`
                : `?limit=${limit}`;
            const res = await apiGet<Paged<HandshakeView>>(
                `/admin/users/${id}/shared-handshakes${q}`
            );
            if (res?.data) setHandshakes((s) => [...s, ...res.data]);
            setHandshakesNext(res?.nextCursor);
        }
        catch (e) {
            setHandshakesError('Failed to load shared handshakes');
        }
        finally {
            setHandshakesLoading(false);
        }
    }

    async function loadMoreReports(id: number) {
        setReportsLoading(true);
        setReportsError(null);
        try {
            const q = reportsNext
                ? `?limit=${limit}&cursor=${encodeURIComponent(String(reportsNext))}`
                : `?limit=${limit}`;
            const res = await apiGet<Paged<any>>(
                `/admin/users/${id}/reports${q}`
            );
            const opened = (res?.data ?? []).filter((r: any) =>
                ['new', 'open'].includes(
                    ((r.status ?? '') as string).toLowerCase()
                )
            );
            if (opened.length) setReports((s) => [...s, ...opened]);
            setReportsNext(res?.nextCursor);
        }
        catch (e) {
            setReportsError('Failed to load reports');
        }
        finally {
            setReportsLoading(false);
        }
    }

    async function handleMasquerade() {
        if (!userID) return;
        const confirmed = window.confirm(
            `Masquerade as user ${userID}? Admin tools will be disabled until you exit.`
        );
        if (!confirmed) return;

        setMasqueradeLoading(true);
        setMasqueradeError(null);
        try {
            await startMasquerade(userID);
            onClose();
            navigate(routes.home);
        }
        catch (err: any) {
            const message = Array.isArray(err)
                ? String(err[0])
                : err?.message || 'Failed to start masquerade.';
            setMasqueradeError(message);
        }
        finally {
            setMasqueradeLoading(false);
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Admin report for ${userID ?? ''}`}
        >
            <div className='max-w-xl'>
                <div className='mb-3 flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between'>
                    <span>Open a temporary session as this user.</span>
                    <Button
                        type='button'
                        variant='warning'
                        onClick={handleMasquerade}
                        disabled={!userID || masqueradeLoading}
                        className='shrink-0'
                    >
                        {masqueradeLoading ? 'Starting...' : 'Masquerade'}
                    </Button>
                </div>
                {masqueradeError && (
                    <div className='mb-3 text-sm text-red-600'>
                        {masqueradeError}
                    </div>
                )}
                <div className='mb-3 flex gap-2'>
                    <Button
                        variant={activeTab === 'login' ? 'secondary' : 'ghost'}
                        onClick={() => setActiveTab('login')}
                        shape='pill'
                    >
                        Login audits
                    </Button>
                    <Button
                        variant={
                            activeTab === 'suspects' ? 'secondary' : 'ghost'
                        }
                        onClick={() => setActiveTab('suspects')}
                        shape='pill'
                    >
                        Suspected linked users
                    </Button>
                    <Button
                        variant={
                            activeTab === 'handshakes' ? 'secondary' : 'ghost'
                        }
                        onClick={() => setActiveTab('handshakes')}
                        shape='pill'
                    >
                        Shared handshakes
                    </Button>
                    <Button
                        variant={
                            activeTab === 'reports' ? 'secondary' : 'ghost'
                        }
                        onClick={() => setActiveTab('reports')}
                        shape='pill'
                    >
                        Reports
                    </Button>
                </div>

                {activeTab === 'login' && (
                    <div>
                        {loginLoading && loginAudits.length === 0 && (
                            <div className='flex items-center gap-2'>
                                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current' />{' '}
                                Loading...
                            </div>
                        )}
                        {loginError && (
                            <div className='text-red-600'>{loginError}</div>
                        )}
                        {loginAudits.length ? (
                            <ul className='text-sm list-disc pl-5'>
                                {loginAudits.map((a, i) => (
                                    <li key={i}>
                                        {a.ipAddress} —{' '}
                                        {a.region ?? a.country ?? 'Unknown'} —{' '}
                                        {new Date(a.createdAt).toLocaleString()}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            !loginLoading && (
                                <div className='text-sm text-gray-600'>
                                    No login audits
                                </div>
                            )
                        )}
                        <div className='mt-2'>
                            {loginNext ? (
                                <Button
                                    variant='ghost'
                                    shape='default'
                                    className='text-sm'
                                    onClick={() =>
                                        userID && loadMoreLogin(userID)
                                    }
                                    disabled={loginLoading}
                                >
                                    {loginLoading ? 'Loading...' : 'Load more'}
                                </Button>
                            ) : null}
                        </div>
                    </div>
                )}

                {activeTab === 'suspects' && (
                    <div>
                        {suspectsLoading && suspects.length === 0 && (
                            <div className='flex items-center gap-2'>
                                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current' />{' '}
                                Loading...
                            </div>
                        )}
                        {suspectsError && (
                            <div className='text-red-600'>{suspectsError}</div>
                        )}
                        {suspects.length ? (
                            <ul className='text-sm list-disc pl-5'>
                                {suspects.map((s) => (
                                    <li key={s.id}>
                                        {s.username ?? s.email ?? `#${s.id}`} —
                                        IPs: {s.ips.join(', ')} — last seen:{' '}
                                        {s.lastSeen
                                            ? new Date(
                                                s.lastSeen
                                            ).toLocaleString()
                                            : 'unknown'}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            !suspectsLoading && (
                                <div className='text-sm text-gray-600'>
                                    No linked users
                                </div>
                            )
                        )}
                        <div className='mt-2'>
                            {suspectsNext ? (
                                <Button
                                    variant='ghost'
                                    shape='default'
                                    className='text-sm'
                                    onClick={() =>
                                        userID && loadMoreSuspects(userID)
                                    }
                                    disabled={suspectsLoading}
                                >
                                    {suspectsLoading
                                        ? 'Loading...'
                                        : 'Load more'}
                                </Button>
                            ) : null}
                        </div>
                    </div>
                )}

                {activeTab === 'handshakes' && (
                    <div>
                        {handshakesLoading && handshakes.length === 0 && (
                            <div className='flex items-center gap-2'>
                                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current' />{' '}
                                Loading...
                            </div>
                        )}
                        {handshakesError && (
                            <div className='text-red-600'>
                                {handshakesError}
                            </div>
                        )}
                        {handshakes.length ? (
                            <ul className='text-sm list-disc pl-5'>
                                {handshakes.map((h) => (
                                    <li key={h.id}>
                                        Handshake #{h.id} — sender: {h.senderID}{' '}
                                        receiver: {h.receiverID} — status:{' '}
                                        {h.status ?? 'unknown'}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            !handshakesLoading && (
                                <div className='text-sm text-gray-600'>
                                    No shared handshakes
                                </div>
                            )
                        )}
                        <div className='mt-2'>
                            {handshakesNext ? (
                                <Button
                                    variant='ghost'
                                    shape='default'
                                    className='text-sm'
                                    onClick={() =>
                                        userID && loadMoreHandshakes(userID)
                                    }
                                    disabled={handshakesLoading}
                                >
                                    {handshakesLoading
                                        ? 'Loading...'
                                        : 'Load more'}
                                </Button>
                            ) : null}
                        </div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div>
                        {reportsLoading && reports.length === 0 && (
                            <div className='flex items-center gap-2'>
                                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current' />{' '}
                                Loading...
                            </div>
                        )}
                        {reportsError && (
                            <div className='text-red-600'>{reportsError}</div>
                        )}
                        {reports.length ? (
                            <ul className='text-sm space-y-3'>
                                {reports.map((r: any) => (
                                    <li key={r.id}>
                                        <ReportCard report={r}>
                                            <Button
                                                variant='ghost'
                                                className='text-xs'
                                                onClick={() => {
                                                    /* noop - individual actions handled in dashboard */
                                                }}
                                            >
                                                View
                                            </Button>
                                        </ReportCard>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            !reportsLoading && (
                                <div className='text-sm text-gray-600'>
                                    No open reports
                                </div>
                            )
                        )}
                        <div className='mt-2'>
                            {reportsNext ? (
                                <Button
                                    variant='ghost'
                                    shape='default'
                                    className='text-sm'
                                    onClick={() =>
                                        userID && loadMoreReports(userID)
                                    }
                                    disabled={reportsLoading}
                                >
                                    {reportsLoading
                                        ? 'Loading...'
                                        : 'Load more'}
                                </Button>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
