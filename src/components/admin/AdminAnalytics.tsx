import React, { useEffect, useMemo, useState } from 'react';
import { getMonthlyActiveUsers } from '@/shared/api/actions';
import { useAuth } from '@/contexts/useAuth';
import { useTheme } from '@/contexts/ThemeContext';

type MAUPoint = { month: string; count: number };

function LineChart({ data }: { data: MAUPoint[] }) {
    const padding = 32;
    const height = 220;
    const width = 640;
    const { theme } = useTheme();

    const palette = useMemo(() => {
        if (theme === 'dark') {
            return {
                bg: '#111827',
                grid: '#374151',
                axis: '#6b7280',
                label: '#9ca3af',
                line: '#60a5fa'
            };
        }
        return {
            bg: '#ffffff',
            grid: '#eeeeee',
            axis: '#cccccc',
            label: '#666666',
            line: '#3b82f6'
        };
    }, [theme]);

    const { points, yMax } = useMemo(() => {
        const counts = data.map((d) => d.count);
        const max = Math.max(10, ...counts);
        const innerW = width - padding * 2;
        const innerH = height - padding * 2;
        const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
        const pts = data.map((d, i) => {
            const x = padding + i * stepX;
            const y = padding + innerH - (d.count / max) * innerH;
            return `${x},${y}`;
        });
        return { points: pts.join(' '), yMax: max };
    }, [data]);

    const yTicks = 4;
    const months = data.map((d) => new Date(d.month).toLocaleDateString(undefined, { month: 'short' }));

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            <rect x={0} y={0} width={width} height={height} fill={palette.bg} />
            {/* Y grid */}
            {Array.from({ length: yTicks + 1 }).map((_, i) => {
                const y = 32 + (i * (height - 64)) / yTicks;
                return <line key={i} x1={32} y1={y} x2={width - 16} y2={y} stroke={palette.grid} strokeWidth={1} />;
            })}
            {/* X labels */}
            {months.map((m, i) => {
                const x = 32 + (i * (width - 64)) / Math.max(1, months.length - 1);
                return (
                    <text key={i} x={x} y={height - 8} textAnchor="middle" fontSize="10" fill={palette.label}>
                        {m}
                    </text>
                );
            })}
            {/* Axis */}
            <line x1={32} y1={height - 32} x2={width - 16} y2={height - 32} stroke={palette.axis} />
            <line x1={32} y1={16} x2={32} y2={height - 32} stroke={palette.axis} />
            {/* Line */}
            <polyline fill="none" stroke={palette.line} strokeWidth={2} points={points} />
            {/* Points */}
            {data.map((d, i) => {
                const innerW = width - 64;
                const innerH = height - 64;
                const x = 32 + (i * innerW) / Math.max(1, data.length - 1);
                const y = 32 + innerH - (d.count / yMax) * innerH;
                return <circle key={i} cx={x} cy={y} r={3} fill={palette.line} />;
            })}
        </svg>
    );
}

export default function AdminAnalytics() {
    const { token } = useAuth();
    const [mau, setMau] = useState<MAUPoint[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (!token) return;
                const data = await getMonthlyActiveUsers(token);
                const sorted = [...data].sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
                if (mounted) setMau(sorted);
            }
            catch (e) {
                setError('Failed to load analytics');
            }
        })();
        return () => {
            mounted = false;
        };
    }, [token]);

    if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>;
    if (!mau) return <div className="text-gray-500 dark:text-gray-400">Loading analytics…</div>;

    const total = mau.reduce((acc, i) => acc + i.count, 0);
    const avg = Math.round(total / Math.max(1, mau.length));

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-6">
                <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Avg MAU (12m)</div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{avg}</div>
                </div>
                <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Last month</div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{mau[mau.length - 1]?.count ?? 0}</div>
                </div>
            </div>
            <div className="border rounded-lg p-2 bg-white dark:bg-gray-900 dark:border-gray-700">
                <LineChart data={mau} />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-sm">
                {mau.map((d) => (
                    <div key={d.month} className="flex justify-between border rounded px-2 py-1 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                        <span className="text-gray-700 dark:text-gray-300">{new Date(d.month).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{d.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
