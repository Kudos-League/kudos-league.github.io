import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/useAuth';
import PostDebugSection from './sections/PostDebugSection';
import StateDebugSection from './sections/StateDebugSection';
import SearchDebugSection from './sections/SearchDebugSection';
import LogsSection from './sections/LogsSection';
import RecordingsSection from './sections/RecordingsSection';
import LogCollectorService from '@/services/logCollector/LogCollectorService';
import { initConsoleInterceptor } from '@/services/logCollector/consoleInterceptor';

type TabType = 'posts' | 'state' | 'search' | 'logs' | 'recordings';
type LayoutMode = 'bottom' | 'right' | 'fullscreen';

const DEFAULT_PANEL_HEIGHT = 300;
const DEFAULT_PANEL_WIDTH = 400;
const MIN_PANEL_SIZE = 100;

export default function DevToolsPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('posts');
    const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
        const saved = localStorage.getItem('devtools-layout-mode');
        return (saved as LayoutMode) || 'bottom';
    });
    const [panelHeight, setPanelHeight] = useState(() => {
        const saved = localStorage.getItem('devtools-panel-height');
        return saved ? parseInt(saved) : DEFAULT_PANEL_HEIGHT;
    });
    const [panelWidth, setPanelWidth] = useState(() => {
        const saved = localStorage.getItem('devtools-panel-width');
        return saved ? parseInt(saved) : DEFAULT_PANEL_WIDTH;
    });
    const [isResizing, setIsResizing] = useState(false);
    const { user } = useAuth();
    const resizeStartPos = useRef({ x: 0, y: 0, startHeight: 0, startWidth: 0 });

    const isDevMode =
        process.env.REACT_APP_BACKEND_URI?.includes('localhost') ||
        process.env.REACT_APP_BACKEND_URI?.includes('api-dev');

    if (!isDevMode) return null;

    // Initialize LogCollectorService on mount
    useEffect(() => {
        if (isDevMode) {
            const service = LogCollectorService.getInstance();
            service.init();
            initConsoleInterceptor();
        }
    }, [isDevMode]);

    // Handle resize
    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (layoutMode === 'bottom') {
                const diff = resizeStartPos.current.y - e.clientY;
                const newHeight = Math.max(MIN_PANEL_SIZE, resizeStartPos.current.startHeight + diff);
                setPanelHeight(newHeight);
            }
            else if (layoutMode === 'right') {
                const diff = e.clientX - resizeStartPos.current.x;
                const newWidth = Math.max(MIN_PANEL_SIZE, resizeStartPos.current.startWidth - diff);
                setPanelWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            if (layoutMode === 'bottom') {
                localStorage.setItem('devtools-panel-height', panelHeight.toString());
            }
            else if (layoutMode === 'right') {
                localStorage.setItem('devtools-panel-width', panelWidth.toString());
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, layoutMode, panelHeight, panelWidth]);

    const handleResizeStart = (e: React.MouseEvent) => {
        setIsResizing(true);
        resizeStartPos.current = {
            x: e.clientX,
            y: e.clientY,
            startHeight: panelHeight,
            startWidth: panelWidth,
        };
    };

    const saveLayoutMode = (mode: LayoutMode) => {
        setLayoutMode(mode);
        localStorage.setItem('devtools-layout-mode', mode);
        if (mode !== 'fullscreen') {
            setIsOpen(true);
        }
    };

    // Render content based on layout mode
    const renderContent = () => (
        <>
            {/* Header */}
            <div className='bg-purple-600 text-white px-4 py-3 flex justify-between items-center shrink-0'>
                <div className='flex items-center gap-3'>
                    <h3 className='font-bold text-sm'>Dev Tools</h3>
                    <span className='text-xs bg-purple-700 px-2 py-1 rounded'>
                        {layoutMode === 'bottom' ? '⬇ Bottom' : layoutMode === 'right' ? '→ Right' : '⛶ Fullscreen'}
                    </span>
                </div>
                <div className='flex items-center gap-2'>
                    {/* Layout mode buttons */}
                    <button
                        onClick={() => saveLayoutMode('bottom')}
                        title='Bottom layout'
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                            layoutMode === 'bottom'
                                ? 'bg-purple-500 text-white'
                                : 'bg-purple-700 hover:bg-purple-600 text-purple-100'
                        }`}
                    >
                        ⬇
                    </button>
                    <button
                        onClick={() => saveLayoutMode('right')}
                        title='Right layout'
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                            layoutMode === 'right'
                                ? 'bg-purple-500 text-white'
                                : 'bg-purple-700 hover:bg-purple-600 text-purple-100'
                        }`}
                    >
                        →
                    </button>
                    <button
                        onClick={() => saveLayoutMode('fullscreen')}
                        title='Fullscreen'
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                            layoutMode === 'fullscreen'
                                ? 'bg-purple-500 text-white'
                                : 'bg-purple-700 hover:bg-purple-600 text-purple-100'
                        }`}
                    >
                        ⛶
                    </button>
                    {layoutMode !== 'fullscreen' && (
                        <button
                            onClick={() => setIsOpen(false)}
                            className='text-lg hover:opacity-75 transition-opacity ml-2'
                        >
                            ×
                        </button>
                    )}
                    {layoutMode === 'fullscreen' && (
                        <button
                            onClick={() => {
                                setLayoutMode('bottom');
                                localStorage.setItem('devtools-layout-mode', 'bottom');
                            }}
                            className='text-lg hover:opacity-75 transition-opacity ml-2'
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className='border-b border-purple-200 dark:border-purple-900 shrink-0 bg-gray-50 dark:bg-slate-900 overflow-x-auto' style={{ scrollBehavior: 'smooth' }}>
                <div className='flex whitespace-nowrap'>
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`px-4 py-2 text-xs font-medium transition-colors flex-shrink-0 ${
                            activeTab === 'posts'
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 border-b-2 border-purple-600'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        Posts
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`px-4 py-2 text-xs font-medium transition-colors flex-shrink-0 ${
                            activeTab === 'search'
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 border-b-2 border-purple-600'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        Search
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 py-2 text-xs font-medium transition-colors flex-shrink-0 ${
                            activeTab === 'logs'
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 border-b-2 border-purple-600'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        Logs
                    </button>
                    <button
                        onClick={() => setActiveTab('recordings')}
                        className={`px-4 py-2 text-xs font-medium transition-colors flex-shrink-0 ${
                            activeTab === 'recordings'
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 border-b-2 border-purple-600'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        Recordings
                    </button>
                    <button
                        onClick={() => setActiveTab('state')}
                        className={`px-4 py-2 text-xs font-medium transition-colors flex-shrink-0 ${
                            activeTab === 'state'
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 border-b-2 border-purple-600'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        State
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className='flex-1 overflow-hidden p-4'>
                {activeTab === 'posts' && <PostDebugSection />}
                {activeTab === 'search' && <SearchDebugSection />}
                {activeTab === 'logs' && <LogsSection />}
                {activeTab === 'recordings' && <RecordingsSection />}
                {activeTab === 'state' && <StateDebugSection user={user} />}
            </div>
        </>
    );

    // Unified layout for all devices
    if (layoutMode === 'fullscreen') {
        return createPortal(
            <div className='fixed inset-0 z-50 bg-white dark:bg-slate-800 flex flex-col overflow-hidden'>
                {renderContent()}
            </div>,
            document.body
        );
    }

    if (layoutMode === 'bottom' && isOpen) {
        return (
            <>
                <div className='fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-purple-200 dark:border-purple-900 flex flex-col overflow-hidden' style={{ height: `${panelHeight}px` }}>
                    {/* Resize handle */}
                    <div
                        onMouseDown={handleResizeStart}
                        className='h-1 bg-purple-400 dark:bg-purple-600 cursor-row-resize hover:bg-purple-500 dark:hover:bg-purple-500 transition-colors shrink-0'
                        title='Drag to resize'
                    />
                    {renderContent()}
                </div>
                {/* Adjust main content margin */}
                <style>{`body > :not([role="presentation"]) { margin-bottom: ${panelHeight}px !important; }`}</style>
            </>
        );
    }

    if (layoutMode === 'right' && isOpen) {
        return (
            <>
                <div className='fixed right-0 top-0 bottom-0 z-50 bg-white dark:bg-slate-800 border-l border-purple-200 dark:border-purple-900 flex flex-col overflow-hidden' style={{ width: `${panelWidth}px` }}>
                    {/* Resize handle */}
                    <div
                        onMouseDown={handleResizeStart}
                        className='w-1 bg-purple-400 dark:bg-purple-600 cursor-col-resize hover:bg-purple-500 dark:hover:bg-purple-500 transition-colors shrink-0 absolute left-0 top-0 bottom-0'
                        title='Drag to resize'
                    />
                    <div className='ml-1 flex-1 flex flex-col overflow-hidden'>
                        {renderContent()}
                    </div>
                </div>
                {/* Adjust main content margin */}
                <style>{`body > :not([role="presentation"]) { margin-right: ${panelWidth}px !important; }`}</style>
            </>
        );
    }

    // When closed on desktop, show toggle button
    return (
        <button
            onClick={() => setIsOpen(true)}
            className='fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110'
            title='Dev Tools'
        >
            ⚙️
        </button>
    );
}
