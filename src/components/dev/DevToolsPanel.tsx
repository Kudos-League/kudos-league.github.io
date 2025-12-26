import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/useAuth';
import PostDebugSection from './sections/PostDebugSection';
import StateDebugSection from './sections/StateDebugSection';

type TabType = 'posts' | 'state';

export default function DevToolsPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('posts');
    const { user } = useAuth();

    const isDevMode =
        process.env.REACT_APP_BACKEND_URI?.includes('localhost') ||
        process.env.REACT_APP_BACKEND_URI?.includes('api-dev');

    if (!isDevMode) return null;

    const modal = isOpen && createPortal(
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
            <div className='bg-white dark:bg-slate-800 rounded-lg shadow-2xl overflow-hidden flex flex-col border border-purple-200 dark:border-purple-900 w-full max-w-4xl max-h-[90vh]'>
                <div className='bg-purple-600 text-white px-6 py-4 flex justify-between items-center shrink-0'>
                    <h3 className='font-bold text-lg'>Dev Tools</h3>
                    <button
                        onClick={() => setIsOpen(false)}
                        className='text-2xl hover:opacity-75 transition-opacity'
                    >
                        ×
                    </button>
                </div>

                <div className='flex border-b border-purple-200 dark:border-purple-900 shrink-0'>
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'posts'
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        Posts
                    </button>
                    <button
                        onClick={() => setActiveTab('state')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'state'
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        State
                    </button>
                </div>

                <div className='flex-1 overflow-y-auto p-6'>
                    {activeTab === 'posts' && <PostDebugSection />}
                    {activeTab === 'state' && <StateDebugSection user={user} />}
                </div>
            </div>
        </div>,
        document.body
    );

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className='fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110'
                title='Dev Tools'
            >
                ⚙️
            </button>

            {modal}
        </>
    );
}
