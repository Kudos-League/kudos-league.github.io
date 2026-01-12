import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/useAuth';
import PostDebugSection from './sections/PostDebugSection';
import StateDebugSection from './sections/StateDebugSection';
import SearchDebugSection from './sections/SearchDebugSection';
import LogsSection from './sections/LogsSection';
import AddHandshakeSection from './sections/AddHandshakeSection';
import AddCommentsSection from './sections/AddCommentsSection';
import LogCollectorService from '@/services/logCollector/LogCollectorService';
import { initConsoleInterceptor } from '@/services/logCollector/consoleInterceptor';

type TabType = 'test' | 'state' | 'logs';
type TestSubTab = 'posts' | 'search' | 'add-handshake' | 'comments';
type LayoutMode = 'bottom' | 'right' | 'fullscreen';

// Module-level store for AI Context logs (survives component remounts)
let aiContextLogsStore: any[] = (() => {
    try {
        const saved = sessionStorage.getItem('devtools-ai-context-logs');
        return saved ? JSON.parse(saved) : [];
    }
    catch {
        return [];
    }
})();

const DEFAULT_PANEL_HEIGHT = 300;
const DEFAULT_PANEL_WIDTH = 400;
const MIN_PANEL_SIZE = 100;
const LAYOUT_MODES: LayoutMode[] = ['bottom', 'right', 'fullscreen'];

export default function DevToolsPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('test');
    const [testSubTab, setTestSubTab] = useState<TestSubTab>('posts');
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
    const [selectedLogs, setSelectedLogsState] = useState<any[]>(
        () => aiContextLogsStore
    );

    // Wrapper to keep module store and sessionStorage in sync
    const setSelectedLogs = (logs: any[] | ((prev: any[]) => any[])) => {
        setSelectedLogsState((prev) => {
            const newLogs = typeof logs === 'function' ? logs(prev) : logs;
            aiContextLogsStore = newLogs;
            // Persist immediately to sessionStorage
            try {
                sessionStorage.setItem(
                    'devtools-ai-context-logs',
                    JSON.stringify(newLogs)
                );
            }
            catch (e) {
                console.warn('Failed to persist AI context logs', e);
            }
            return newLogs;
        });
    };

    // Sync state with module store on mount (handles remount scenarios)
    useEffect(() => {
        // Try to restore from sessionStorage first, then module store
        let logsToRestore = aiContextLogsStore;
        if (logsToRestore.length === 0) {
            try {
                const saved = sessionStorage.getItem(
                    'devtools-ai-context-logs'
                );
                if (saved) {
                    logsToRestore = JSON.parse(saved);
                    aiContextLogsStore = logsToRestore;
                }
            }
            catch (e) {
                // ignore
            }
        }
        if (logsToRestore.length > 0 && selectedLogs.length === 0) {
            setSelectedLogsState(logsToRestore);
        }
    }, []);
    const [showAIContext, setShowAIContext] = useState(false);
    const [aiContextMode, setAIContextMode] = useState<'summarized' | 'full'>(
        'summarized'
    );
    const [logDisplayModes, setLogDisplayModes] = useState<
        Map<string, 'summarized' | 'full'>
    >(new Map());
    const [aiContextExclusions, setAIContextExclusions] = useState<Set<string>>(
        new Set()
    );
    const [aiContextTitleExclusions, setAIContextTitleExclusions] = useState<
        Set<string>
    >(() => {
        try {
            const saved = localStorage.getItem('devtools-ai-title-exclusions');
            return new Set(saved ? JSON.parse(saved) : []);
        }
        catch {
            return new Set();
        }
    });
    const [aiContextTitleInclusions, setAIContextTitleInclusions] = useState<
        Set<string>
    >(() => {
        try {
            const saved = localStorage.getItem('devtools-ai-title-inclusions');
            return new Set(saved ? JSON.parse(saved) : []);
        }
        catch {
            return new Set();
        }
    });
    const [newTitleExclusion, setNewTitleExclusion] = useState('');
    const [newTitleInclusion, setNewTitleInclusion] = useState('');
    const { user } = useAuth();
    const resizeStartPos = useRef({
        x: 0,
        y: 0,
        startHeight: 0,
        startWidth: 0
    });

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

    // Listen for toggle event from navbar
    useEffect(() => {
        const handleToggle = () => {
            setIsOpen((prev) => !prev);
        };

        window.addEventListener('toggle-devtools', handleToggle);
        return () =>
            window.removeEventListener('toggle-devtools', handleToggle);
    }, []);

    // Handle resize
    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (layoutMode === 'bottom') {
                const diff = resizeStartPos.current.y - e.clientY;
                const newHeight = Math.max(
                    MIN_PANEL_SIZE,
                    resizeStartPos.current.startHeight + diff
                );
                setPanelHeight(newHeight);
            }
            else if (layoutMode === 'right') {
                const diff = e.clientX - resizeStartPos.current.x;
                const newWidth = Math.max(
                    MIN_PANEL_SIZE,
                    resizeStartPos.current.startWidth - diff
                );
                setPanelWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            if (layoutMode === 'bottom') {
                localStorage.setItem(
                    'devtools-panel-height',
                    panelHeight.toString()
                );
            }
            else if (layoutMode === 'right') {
                localStorage.setItem(
                    'devtools-panel-width',
                    panelWidth.toString()
                );
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
            startWidth: panelWidth
        };
    };

    const saveLayoutMode = (mode: LayoutMode) => {
        setLayoutMode(mode);
        localStorage.setItem('devtools-layout-mode', mode);
        if (mode !== 'fullscreen') {
            setIsOpen(true);
        }
    };

    const cycleLayoutMode = () => {
        const currentIndex = LAYOUT_MODES.indexOf(layoutMode);
        const nextIndex = (currentIndex + 1) % LAYOUT_MODES.length;
        saveLayoutMode(LAYOUT_MODES[nextIndex]);
    };

    const generateAIText = (): string => {
        if (selectedLogs.length === 0) return '';

        const lines: string[] = [];
        const firstTime = new Date(
            selectedLogs[0].timestamp
        ).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const lastTime = new Date(
            selectedLogs[selectedLogs.length - 1].timestamp
        ).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Group logs by type and generate context
        const byType = selectedLogs.reduce(
            (acc, log) => {
                if (!acc[log.type]) acc[log.type] = [];
                acc[log.type].push(log);
                return acc;
            },
            {} as Record<string, any[]>
        );

        // Generate intro
        lines.push(`Logs from ${firstTime} to ${lastTime}:\n`);

        // Add context for each type
        if (byType.websocket) {
            const urls = new Set(byType.websocket.map((l: any) => l.event));
            lines.push(
                `WebSocket messages (${byType.websocket.length}): ${Array.from(urls).join(', ')}`
            );
            byType.websocket.forEach((log: any) => {
                const dir = log.direction === 'sent' ? '→' : '←';
                lines.push(`  ${dir} ${log.event}: ${log.message}`);
            });
            lines.push('');
        }

        if (byType.network) {
            const urls = new Set(byType.network.map((l: any) => l.url));
            lines.push(
                `Network requests (${byType.network.length}): ${Array.from(urls).join(', ')}`
            );
            byType.network.forEach((log: any) => {
                lines.push(`  ${log.method} ${log.url} → ${log.status}`);
            });
            lines.push('');
        }

        if (byType['react-query']) {
            lines.push(
                `React Query operations (${byType['react-query'].length}):`
            );
            byType['react-query'].forEach((log: any) => {
                lines.push(
                    `  ${log.operation}: ${log.queryKey} (${log.status})`
                );
            });
            lines.push('');
        }

        if (byType.console) {
            lines.push(`Console logs (${byType.console.length}):`);
            byType.console.forEach((log: any) => {
                lines.push(`  [${log.level?.toUpperCase()}] ${log.message}`);
            });
            lines.push('');
        }

        return lines.join('\n');
    };

    const generateFullAIText = (): string => {
        const filteredLogs = getFilteredLogs();
        if (filteredLogs.length === 0) return '';

        const lines: string[] = [];
        const firstTime = new Date(
            filteredLogs[0].timestamp
        ).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const lastTime = new Date(
            filteredLogs[filteredLogs.length - 1].timestamp
        ).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        lines.push(`Full Logs from ${firstTime} to ${lastTime}:\n`);
        lines.push('═'.repeat(60) + '\n');

        filteredLogs.forEach((log, idx) => {
            lines.push(`[${idx + 1}] ${getDetailedLogContent(log)}`);
            lines.push('─'.repeat(60) + '\n');
        });

        return lines.join('\n');
    };

    const generateAIContextText = (): string => {
        const filteredLogs = getFilteredLogs();
        if (filteredLogs.length === 0) return '';

        // Check if all logs should use full mode (either global full or all individual overrides are full)
        const allFullMode = filteredLogs.every((log) => {
            const displayMode = logDisplayModes.get(log.id) || aiContextMode;
            return displayMode === 'full';
        });

        // Check if all logs should use summary mode
        const allSummaryMode = filteredLogs.every((log) => {
            const displayMode = logDisplayModes.get(log.id) || aiContextMode;
            return displayMode === 'summarized';
        });

        if (allFullMode) {
            return generateFullAIText();
        }

        if (allSummaryMode) {
            return generateAIText();
        }

        // Mixed mode: generate text respecting individual log modes
        const lines: string[] = [];
        const firstTime = new Date(
            filteredLogs[0].timestamp
        ).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const lastTime = new Date(
            filteredLogs[filteredLogs.length - 1].timestamp
        ).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        lines.push(
            `Logs from ${firstTime} to ${lastTime} (mixed detail levels):\n`
        );
        lines.push('═'.repeat(60) + '\n');

        filteredLogs.forEach((log, idx) => {
            const displayMode = logDisplayModes.get(log.id) || aiContextMode;
            if (displayMode === 'full') {
                lines.push(`[${idx + 1}] ${getDetailedLogContent(log)}`);
                lines.push('─'.repeat(60) + '\n');
            }
            else {
                // Summary format for this log
                const time = new Date(log.timestamp).toLocaleTimeString(
                    'en-US',
                    {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }
                );
                switch (log.type) {
                case 'console':
                    lines.push(
                        `[${idx + 1}] [${time}] [${(log as any).level?.toUpperCase() || 'LOG'}] ${log.message}`
                    );
                    break;
                case 'network':
                    lines.push(
                        `[${idx + 1}] [${time}] ${(log as any).method} ${(log as any).url} → ${(log as any).status}`
                    );
                    break;
                case 'websocket': {
                    const dir =
                            (log as any).direction === 'sent' ? '→' : '←';
                    lines.push(
                        `[${idx + 1}] [${time}] ${dir} ${(log as any).event}: ${log.message}`
                    );
                    break;
                }
                case 'react-query':
                    lines.push(
                        `[${idx + 1}] [${time}] ${(log as any).operation}: ${(log as any).queryKey} (${(log as any).status})`
                    );
                    break;
                default:
                    lines.push(`[${idx + 1}] [${time}] ${log.message}`);
                }
            }
        });

        return lines.join('\n');
    };

    const handleCopyAIText = () => {
        const text = generateAIContextText();
        navigator.clipboard.writeText(text);
    };

    const getDetailedLogContent = (log: any): string => {
        const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });

        let content = `[${time}] ${log.type.toUpperCase()}\n`;
        content += `ID: ${log.id}\n`;
        content += `─`.repeat(60) + '\n';

        switch (log.type) {
        case 'console': {
            const consoleLog = log as any;
            content += `Level: ${consoleLog.level?.toUpperCase() || 'LOG'}\n`;
            content += `Message: ${consoleLog.message}\n`;
            if (consoleLog.args?.length > 0) {
                content += `Args:\n${JSON.stringify(consoleLog.args, null, 2)}\n`;
            }
            break;
        }
        case 'network': {
            const networkLog = log as any;
            content += `Method: ${networkLog.method}\n`;
            content += `URL: ${networkLog.url}\n`;
            content += `Status: ${networkLog.status}\n`;
            content += `Duration: ${networkLog.duration}ms\n`;
            if (networkLog.requestBody) {
                content += `Request Body:\n${JSON.stringify(networkLog.requestBody, null, 2)}\n`;
            }
            if (networkLog.responseBody) {
                content += `Response Body:\n${JSON.stringify(networkLog.responseBody, null, 2)}\n`;
            }
            break;
        }
        case 'websocket': {
            const wsLog = log as any;
            content += `Direction: ${wsLog.direction === 'sent' ? 'Sent (→)' : 'Received (←)'}\n`;
            content += `Event: ${wsLog.event}\n`;
            content += `Message: ${wsLog.message}\n`;
            if (wsLog.payload) {
                content += `Payload:\n${JSON.stringify(wsLog.payload, null, 2)}\n`;
            }
            break;
        }
        case 'react-query': {
            const queryLog = log as any;
            content += `Operation: ${queryLog.operation}\n`;
            content += `Query Key: ${queryLog.queryKey}\n`;
            content += `Status: ${queryLog.status}\n`;
            content += `Message: ${queryLog.message}\n`;
            break;
        }
        default:
            content += `Message: ${log.message}\n`;
        }

        return content;
    };

    const toggleLogMode = (logId: string) => {
        const newModes = new Map(logDisplayModes);
        const currentMode = newModes.get(logId) || aiContextMode;
        const newMode = currentMode === 'summarized' ? 'full' : 'summarized';
        newModes.set(logId, newMode);
        setLogDisplayModes(newModes);
    };

    const toggleExclusion = (exclusion: string) => {
        const newExclusions = new Set(aiContextExclusions);
        if (newExclusions.has(exclusion)) {
            newExclusions.delete(exclusion);
        }
        else {
            newExclusions.add(exclusion);
        }
        setAIContextExclusions(newExclusions);
    };

    // Persist selected logs to sessionStorage
    useEffect(() => {
        sessionStorage.setItem(
            'devtools-ai-context-logs',
            JSON.stringify(selectedLogs)
        );
    }, [selectedLogs]);

    // Persist title exclusions to localStorage
    useEffect(() => {
        localStorage.setItem(
            'devtools-ai-title-exclusions',
            JSON.stringify(Array.from(aiContextTitleExclusions))
        );
    }, [aiContextTitleExclusions]);

    // Persist title inclusions to localStorage
    useEffect(() => {
        localStorage.setItem(
            'devtools-ai-title-inclusions',
            JSON.stringify(Array.from(aiContextTitleInclusions))
        );
    }, [aiContextTitleInclusions]);

    const addTitleExclusion = (title: string) => {
        if (title.trim()) {
            const newExclusions = new Set(aiContextTitleExclusions);
            newExclusions.add(title.trim());
            setAIContextTitleExclusions(newExclusions);
            setNewTitleExclusion('');
        }
    };

    const removeTitleExclusion = (title: string) => {
        const newExclusions = new Set(aiContextTitleExclusions);
        newExclusions.delete(title);
        setAIContextTitleExclusions(newExclusions);
    };

    const addTitleInclusion = (title: string) => {
        if (title.trim()) {
            const newInclusions = new Set(aiContextTitleInclusions);
            newInclusions.add(title.trim());
            setAIContextTitleInclusions(newInclusions);
            setNewTitleInclusion('');
        }
    };

    const removeTitleInclusion = (title: string) => {
        const newInclusions = new Set(aiContextTitleInclusions);
        newInclusions.delete(title);
        setAIContextTitleInclusions(newInclusions);
    };

    const isLogExcluded = (log: any): boolean => {
        // Check if log type is excluded
        if (aiContextExclusions.has(log.type)) return true;

        // Check specific exclusions
        if (aiContextExclusions.has(`${log.type}:${log.message}}`)) return true;
        if (
            log.type === 'react-query' &&
            aiContextExclusions.has(`query:${log.queryKey}`)
        )
            return true;
        if (
            log.type === 'network' &&
            aiContextExclusions.has(`network:${log.url}`)
        )
            return true;

        // Check title-based inclusions first (if any exist, log must match at least one)
        const titleInclusionsArray = Array.from(aiContextTitleInclusions);
        if (titleInclusionsArray.length > 0) {
            let matchesInclusion = false;
            for (let i = 0; i < titleInclusionsArray.length; i++) {
                if (
                    log.message
                        .toLowerCase()
                        .includes(titleInclusionsArray[i].toLowerCase())
                ) {
                    matchesInclusion = true;
                    break;
                }
            }
            if (!matchesInclusion) return true; // Exclude if doesn't match any inclusion
        }

        // Check title-based exclusions (matches if log message contains excluded pattern)
        const titleExclusionsArray = Array.from(aiContextTitleExclusions);
        for (let i = 0; i < titleExclusionsArray.length; i++) {
            if (
                log.message
                    .toLowerCase()
                    .includes(titleExclusionsArray[i].toLowerCase())
            ) {
                return true;
            }
        }

        return false;
    };

    const getFilteredLogs = (): any[] => {
        return selectedLogs.filter((log) => !isLogExcluded(log));
    };

    // Render inline AI Context panel (replaces modal)
    const renderInlineAIContext = () => {
        if (selectedLogs.length === 0 || !showAIContext) return null;

        const filteredLogs = getFilteredLogs();

        return (
            <div className='bg-slate-900 border-b border-purple-500 overflow-hidden'>
                {/* Compact header with controls */}
                <div className='bg-purple-700 px-3 py-2 flex items-center gap-3 flex-wrap'>
                    <div className='flex items-center gap-2'>
                        <span className='text-white text-xs font-semibold'>
                            AI Context ({filteredLogs.length}/
                            {selectedLogs.length})
                        </span>
                        <button
                            onClick={handleCopyAIText}
                            title='Copy filtered to clipboard'
                            className='px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition-colors'
                        >
                            Copy
                        </button>
                        <button
                            onClick={() => setSelectedLogs([])}
                            title='Clear all'
                            className='px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors'
                        >
                            Clear
                        </button>
                    </div>

                    {/* Display mode */}
                    <div className='flex items-center gap-1'>
                        <span className='text-purple-200 text-xs'>
                            Set all:
                        </span>
                        <button
                            onClick={() => setAIContextMode('summarized')}
                            className={`px-2 py-0.5 text-xs rounded transition-colors ${
                                aiContextMode === 'summarized'
                                    ? 'bg-white text-purple-700'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                        >
                            Summary
                        </button>
                        <button
                            onClick={() => setAIContextMode('full')}
                            className={`px-2 py-0.5 text-xs rounded transition-colors ${
                                aiContextMode === 'full'
                                    ? 'bg-white text-purple-700'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                        >
                            Full
                        </button>
                    </div>

                    {/* Type exclusions */}
                    <div className='flex items-center gap-1'>
                        <span className='text-purple-200 text-xs'>
                            Exclude:
                        </span>
                        {['console', 'network', 'websocket', 'react-query'].map(
                            (type) => (
                                <button
                                    key={type}
                                    onClick={() => toggleExclusion(type)}
                                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                                        aiContextExclusions.has(type)
                                            ? 'bg-red-500 text-white'
                                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                                    }`}
                                >
                                    {type === 'react-query'
                                        ? 'Query'
                                        : type.charAt(0).toUpperCase() +
                                          type.slice(1)}
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* Title filters row */}
                <div className='bg-purple-800 px-3 py-1.5 flex items-center gap-4 flex-wrap'>
                    {/* Include by title */}
                    <div className='flex items-center gap-1'>
                        <span className='text-purple-200 text-xs'>
                            Include:
                        </span>
                        <input
                            type='text'
                            value={newTitleInclusion}
                            onChange={(e) =>
                                setNewTitleInclusion(e.target.value)
                            }
                            onKeyDown={(e) => {
                                if (e.key === 'Enter')
                                    addTitleInclusion(newTitleInclusion);
                            }}
                            placeholder='e.g. Query: posts'
                            className='w-32 px-2 py-0.5 text-xs bg-purple-900 border border-purple-600 rounded text-white placeholder-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400'
                        />
                        <button
                            onClick={() => addTitleInclusion(newTitleInclusion)}
                            disabled={!newTitleInclusion.trim()}
                            className='px-2 py-0.5 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded transition-colors'
                        >
                            +
                        </button>
                        {Array.from(aiContextTitleInclusions).map(
                            (inclusion) => (
                                <span
                                    key={inclusion}
                                    className='inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-600 text-white rounded'
                                >
                                    {inclusion}
                                    <button
                                        onClick={() =>
                                            removeTitleInclusion(inclusion)
                                        }
                                        className='hover:bg-green-700 rounded'
                                    >
                                        ×
                                    </button>
                                </span>
                            )
                        )}
                    </div>

                    {/* Exclude by title */}
                    <div className='flex items-center gap-1'>
                        <span className='text-purple-200 text-xs'>
                            Exclude:
                        </span>
                        <input
                            type='text'
                            value={newTitleExclusion}
                            onChange={(e) =>
                                setNewTitleExclusion(e.target.value)
                            }
                            onKeyDown={(e) => {
                                if (e.key === 'Enter')
                                    addTitleExclusion(newTitleExclusion);
                            }}
                            placeholder='e.g. Query: events'
                            className='w-32 px-2 py-0.5 text-xs bg-purple-900 border border-purple-600 rounded text-white placeholder-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400'
                        />
                        <button
                            onClick={() => addTitleExclusion(newTitleExclusion)}
                            disabled={!newTitleExclusion.trim()}
                            className='px-2 py-0.5 text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded transition-colors'
                        >
                            +
                        </button>
                        {Array.from(aiContextTitleExclusions).map(
                            (exclusion) => (
                                <span
                                    key={exclusion}
                                    className='inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-red-600 text-white rounded'
                                >
                                    {exclusion}
                                    <button
                                        onClick={() =>
                                            removeTitleExclusion(exclusion)
                                        }
                                        className='hover:bg-red-700 rounded'
                                    >
                                        ×
                                    </button>
                                </span>
                            )
                        )}
                    </div>
                </div>

                {/* Logs list - compact horizontal scrollable */}
                <div className='max-h-48 overflow-y-auto bg-slate-800'>
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log, idx) => {
                            const displayMode =
                                logDisplayModes.get(log.id) || aiContextMode;
                            const isFullMode = displayMode === 'full';

                            return (
                                <div
                                    key={log.id}
                                    className='border-b border-slate-700 hover:bg-slate-700/50 transition-colors'
                                >
                                    <div className='px-3 py-1.5 flex items-center gap-2'>
                                        <span className='text-gray-400 text-xs w-6'>
                                            {idx + 1}.
                                        </span>
                                        <span className='text-gray-200 text-xs flex-1 truncate'>
                                            {log.message}
                                        </span>
                                        <div className='flex gap-1 flex-shrink-0'>
                                            <button
                                                onClick={() =>
                                                    toggleLogMode(log.id)
                                                }
                                                className={`w-6 h-6 rounded text-xs ${isFullMode ? 'bg-blue-600 text-white' : 'bg-slate-600 text-gray-300'}`}
                                                title={
                                                    isFullMode
                                                        ? 'Show summary'
                                                        : 'Show full'
                                                }
                                            >
                                                {isFullMode ? '📄' : '📋'}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setSelectedLogs(
                                                        selectedLogs.filter(
                                                            (l) =>
                                                                l.id !== log.id
                                                        )
                                                    )
                                                }
                                                className='w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded text-xs'
                                                title='Remove'
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                    {isFullMode && (
                                        <pre className='px-3 pb-2 pl-9 text-xs text-gray-400 whitespace-pre-wrap break-words'>
                                            {getDetailedLogContent(log)}
                                        </pre>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className='py-4 text-center text-gray-500 text-xs'>
                            All logs are filtered out
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render content based on layout mode
    const renderContent = () => (
        <>
            {/* Header */}
            <div className='bg-purple-600 text-white px-4 py-2 flex justify-between items-center shrink-0'>
                <div className='flex items-center gap-3'>
                    <h3 className='font-bold text-sm'>Dev Tools</h3>
                    <button
                        onClick={cycleLayoutMode}
                        title='Cycle layout mode'
                        className='text-xs bg-purple-700 hover:bg-purple-600 px-2 py-1 rounded transition-colors cursor-pointer'
                    >
                        {layoutMode === 'bottom'
                            ? '⬇ Bottom'
                            : layoutMode === 'right'
                                ? '→ Right'
                                : '⛶ Fullscreen'}
                    </button>
                    {/* AI Context toggle - integrated into header */}
                    {selectedLogs.length > 0 && (
                        <button
                            onClick={() => setShowAIContext(!showAIContext)}
                            title='Toggle AI Context'
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                                showAIContext
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-purple-700 hover:bg-purple-600 text-purple-100'
                            }`}
                        >
                            📋 AI ({selectedLogs.length})
                        </button>
                    )}
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
                                localStorage.setItem(
                                    'devtools-layout-mode',
                                    'bottom'
                                );
                            }}
                            className='text-lg hover:opacity-75 transition-opacity ml-2'
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Inline AI Context panel */}
            {renderInlineAIContext()}

            {/* Tabs */}
            <div
                className='border-b border-purple-200 dark:border-purple-900 shrink-0 bg-gray-50 dark:bg-slate-900 overflow-x-auto'
                style={{ scrollBehavior: 'smooth' }}
            >
                <div className='flex whitespace-nowrap'>
                    <button
                        onClick={() => setActiveTab('test')}
                        className={`px-4 py-2 text-xs font-medium transition-colors flex-shrink-0 ${
                            activeTab === 'test'
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 border-b-2 border-purple-600'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        Test
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

            {/* Subtabs for Test tab */}
            {activeTab === 'test' && (
                <div
                    className='border-b border-purple-100 dark:border-purple-800 shrink-0 bg-gray-100 dark:bg-slate-800 overflow-x-auto'
                    style={{ scrollBehavior: 'smooth' }}
                >
                    <div className='flex whitespace-nowrap'>
                        <button
                            onClick={() => setTestSubTab('posts')}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors flex-shrink-0 ${
                                testSubTab === 'posts'
                                    ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200 border-b-2 border-purple-500'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            Posts
                        </button>
                        <button
                            onClick={() => setTestSubTab('search')}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors flex-shrink-0 ${
                                testSubTab === 'search'
                                    ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200 border-b-2 border-purple-500'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            Search
                        </button>
                        <button
                            onClick={() => setTestSubTab('add-handshake')}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors flex-shrink-0 ${
                                testSubTab === 'add-handshake'
                                    ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200 border-b-2 border-purple-500'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            Handshakes
                        </button>
                        <button
                            onClick={() => setTestSubTab('comments')}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors flex-shrink-0 ${
                                testSubTab === 'comments'
                                    ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200 border-b-2 border-purple-500'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            Comments
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className='flex-1 overflow-y-auto p-4'>
                {activeTab === 'test' && testSubTab === 'posts' && (
                    <PostDebugSection />
                )}
                {activeTab === 'test' && testSubTab === 'search' && (
                    <SearchDebugSection />
                )}
                {activeTab === 'test' && testSubTab === 'add-handshake' && (
                    <AddHandshakeSection />
                )}
                {activeTab === 'test' && testSubTab === 'comments' && (
                    <AddCommentsSection />
                )}
                {activeTab === 'logs' && (
                    <LogsSection
                        selectedLogs={selectedLogs}
                        onSelectedLogsChange={setSelectedLogs}
                    />
                )}
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
                <div
                    className='fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-purple-200 dark:border-purple-900 flex flex-col overflow-hidden'
                    style={{ height: `${panelHeight}px` }}
                >
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
                <div
                    className='fixed right-0 top-0 bottom-0 z-50 bg-white dark:bg-slate-800 border-l border-purple-200 dark:border-purple-900 flex flex-col overflow-hidden'
                    style={{ width: `${panelWidth}px` }}
                >
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
            className='fixed bottom-6 left-6 z-40 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110'
            title='Dev Tools'
        ></button>
    );
}
