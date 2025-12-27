import React from 'react';
import { useAuth } from '@/contexts/useAuth';
import type { UserDTO } from '@/shared/api/types';

interface StateDebugSectionProps {
	user: UserDTO | null;
}

export default function StateDebugSection({ user }: StateDebugSectionProps) {
    const { token, isLoggedIn } = useAuth();

    return (
        <div className='space-y-4 text-xs font-mono'>
            <div>
                <div className='font-bold text-gray-900 dark:text-white mb-1'>Auth Status</div>
                <div className='bg-gray-100 dark:bg-slate-900 p-2 rounded space-y-1'>
                    <div>
                        <span className='text-gray-600 dark:text-gray-400'>Logged In:</span>
                        <span className='ml-2 text-blue-600 dark:text-blue-400'>{isLoggedIn ? 'true' : 'false'}</span>
                    </div>
                    <div>
                        <span className='text-gray-600 dark:text-gray-400'>User ID:</span>
                        <span className='ml-2 text-blue-600 dark:text-blue-400'>{user?.id || 'N/A'}</span>
                    </div>
                    <div>
                        <span className='text-gray-600 dark:text-gray-400'>Username:</span>
                        <span className='ml-2 text-blue-600 dark:text-blue-400'>{user?.username || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div>
                <div className='font-bold text-gray-900 dark:text-white mb-1'>Token</div>
                <div className='bg-gray-100 dark:bg-slate-900 p-2 rounded break-all max-h-32 overflow-y-auto'>
                    <span className='text-green-600 dark:text-green-400 text-xs font-mono'>
                        {token || 'N/A'}
                    </span>
                </div>
            </div>

            <div>
                <div className='font-bold text-gray-900 dark:text-white mb-1'>Environment</div>
                <div className='bg-gray-100 dark:bg-slate-900 p-2 rounded space-y-1'>
                    <div>
                        <span className='text-gray-600 dark:text-gray-400'>Backend URI:</span>
                        <span className='ml-2 text-blue-600 dark:text-blue-400 break-all'>
                            {process.env.REACT_APP_BACKEND_URI}
                        </span>
                    </div>
                    <div>
                        <span className='text-gray-600 dark:text-gray-400'>WSS URI:</span>
                        <span className='ml-2 text-blue-600 dark:text-blue-400'>
                            {process.env.REACT_APP_WSS_URI}
                        </span>
                    </div>
                </div>
            </div>

            <div>
                <div className='font-bold text-gray-900 dark:text-white mb-1'>User Profile</div>
                <div className='bg-gray-100 dark:bg-slate-900 p-2 rounded space-y-1 max-h-32 overflow-y-auto'>
                    {user ? (
                        <>
                            <div>
                                <span className='text-gray-600 dark:text-gray-400'>Email:</span>
                                <span className='ml-2 text-blue-600 dark:text-blue-400'>{user.email}</span>
                            </div>
                            <div>
                                <span className='text-gray-600 dark:text-gray-400'>Kudos:</span>
                                <span className='ml-2 text-blue-600 dark:text-blue-400'>{user.kudos || 0}</span>
                            </div>
                            <div>
                                <span className='text-gray-600 dark:text-gray-400'>Display Name:</span>
                                <span className='ml-2 text-blue-600 dark:text-blue-400'>{user.displayName || 'N/A'}</span>
                            </div>
                        </>
                    ) : (
                        <span className='text-gray-500'>Not logged in</span>
                    )}
                </div>
            </div>
        </div>
    );
}
