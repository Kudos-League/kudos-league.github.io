import React, { useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import type { UserDTO } from '@/shared/api/types';
import { Copy, Check, ClipboardCopy } from 'lucide-react';

interface StateDebugSectionProps {
    user: UserDTO | null;
}

function CopyButton({ value, label }: { value: any; label?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!value) return;
        const text =
            typeof value === 'object'
                ? JSON.stringify(value, null, 2)
                : String(value);
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-1.5 py-1 rounded transition-all 
                ${label ? 'bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-sans' : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-500'}`}
            title={label || 'Copy to clipboard'}
        >
            {copied ? (
                <Check
                    size={13}
                    className={label ? 'text-white' : 'text-green-500'}
                />
            ) : (
                <Copy size={13} />
            )}
            {label && <span>{copied ? 'Copied!' : label}</span>}
        </button>
    );
}

export default function StateDebugSection({ user }: StateDebugSectionProps) {
    const { token, isLoggedIn } = useAuth();

    const envData = {
        backend: process.env.REACT_APP_BACKEND_URI,
        wss: process.env.REACT_APP_WSS_URI
    };

    const authData = {
        isLoggedIn,
        userId: user?.id,
        username: user?.username
    };

    const fullState = {
        auth: authData,
        environment: envData,
        user: user,
        token: token
    };

    const SectionHeader = ({ title, data }: { title: string; data: any }) => (
        <div className='flex justify-between items-center mb-1'>
            <div className='font-bold text-gray-900 dark:text-white uppercase tracking-tight'>
                {title}
            </div>
            <CopyButton value={data} />
        </div>
    );

    const DebugRow = ({ label, value }: { label: string; value: any }) => (
        <div className='flex items-center justify-between group py-0.5 border-b border-gray-200/50 dark:border-slate-800/50 last:border-0'>
            <div className='flex-1 min-w-0 pr-2'>
                <span className='text-gray-500 dark:text-gray-500'>
                    {label}:
                </span>
                <span className='ml-2 text-blue-600 dark:text-blue-400 break-all'>
                    {value !== undefined && value !== null
                        ? String(value)
                        : 'N/A'}
                </span>
            </div>
            {value && <CopyButton value={value} />}
        </div>
    );

    return (
        <div className='space-y-6 text-xs font-mono p-1'>
            {/* Global Actions */}
            <div className='flex items-center justify-between border-b border-gray-200 dark:border-slate-700 pb-2'>
                <span className='text-[10px] font-bold text-gray-400 uppercase'>
                    Debug Console
                </span>
                <CopyButton value={fullState} label='Copy Full State' />
            </div>

            {/* Auth Status */}
            <section>
                <SectionHeader title='Auth Status' data={authData} />
                <div className='bg-gray-100 dark:bg-slate-900 p-2 rounded shadow-inner'>
                    <DebugRow
                        label='Status'
                        value={isLoggedIn ? 'Authenticated' : 'Guest'}
                    />
                    <DebugRow label='ID' value={user?.id} />
                    <DebugRow label='User' value={user?.username} />
                </div>
            </section>

            {/* Token */}
            <section>
                <SectionHeader title='Session Token' data={token} />
                <div className='bg-gray-100 dark:bg-slate-900 p-2 rounded break-all max-h-24 overflow-y-auto scrollbar-thin shadow-inner'>
                    <span className='text-green-600 dark:text-green-400 text-[10px]'>
                        {token || 'No token found'}
                    </span>
                </div>
            </section>

            {/* Environment */}
            <section>
                <SectionHeader title='Environment' data={envData} />
                <div className='bg-gray-100 dark:bg-slate-900 p-2 rounded shadow-inner'>
                    <DebugRow label='API' value={envData.backend} />
                    <DebugRow label='WSS' value={envData.wss} />
                </div>
            </section>

            {/* User Profile */}
            <section>
                <SectionHeader title='User Profile' data={user} />
                <div className='bg-gray-100 dark:bg-slate-900 p-2 rounded max-h-40 overflow-y-auto shadow-inner'>
                    {user ? (
                        <>
                            <DebugRow label='Email' value={user.email} />
                            <DebugRow label='Kudos' value={user.kudos} />
                            <DebugRow
                                label='Display'
                                value={user.displayName}
                            />
                        </>
                    ) : (
                        <div className='text-gray-500 italic py-1'>
                            No profile data loaded
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
