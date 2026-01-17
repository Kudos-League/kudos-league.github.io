import React, { useState } from 'react';
import {
    componentsByFolder,
    folders,
    ComponentInfo
} from '@/generated/componentRegistry';

export default function ComponentsDebugSection() {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        new Set()
    );
    const [search, setSearch] = useState('');

    const toggleFolder = (folder: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folder)) {
            newExpanded.delete(folder);
        }
        else {
            newExpanded.add(folder);
        }
        setExpandedFolders(newExpanded);
    };

    const openInPlayground = (component: ComponentInfo) => {
        window.open(`/dev/components?component=${encodeURIComponent(component.importPath)}`, '_blank');
    };

    const filteredFolders = search
        ? folders.filter((folder) =>
            componentsByFolder[folder].some(
                (c) =>
                    c.name.toLowerCase().includes(search.toLowerCase()) ||
                      c.folder.toLowerCase().includes(search.toLowerCase())
            )
        )
        : folders;

    const getFilteredComponents = (folder: string) => {
        if (!search) return componentsByFolder[folder];
        return componentsByFolder[folder].filter(
            (c) =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.folder.toLowerCase().includes(search.toLowerCase())
        );
    };

    return (
        <div className='space-y-3'>
            <div className='flex items-center justify-between gap-2'>
                <span className='text-xs text-gray-500 dark:text-gray-400'>
                    {Object.values(componentsByFolder).flat().length} components
                </span>
                <button
                    onClick={() => window.open('/dev/components', '_blank')}
                    className='px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors'
                >
                    Open Playground
                </button>
            </div>

            <input
                type='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search components...'
                className='w-full px-3 py-1.5 text-xs bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500'
            />

            <div className='space-y-1 max-h-[300px] overflow-y-auto'>
                {filteredFolders.map((folder) => {
                    const components = getFilteredComponents(folder);
                    if (components.length === 0) return null;

                    const isExpanded = expandedFolders.has(folder);

                    return (
                        <div key={folder} className='border border-gray-200 dark:border-slate-700 rounded'>
                            <button
                                onClick={() => toggleFolder(folder)}
                                className='w-full px-2 py-1.5 text-left text-xs font-medium bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between'
                            >
                                <span className='text-gray-700 dark:text-gray-200'>
                                    {isExpanded ? '▼' : '▶'} {folder}
                                </span>
                                <span className='text-gray-400 dark:text-gray-500'>
                                    {components.length}
                                </span>
                            </button>
                            {isExpanded && (
                                <div className='divide-y divide-gray-100 dark:divide-slate-700'>
                                    {components.map((component) => (
                                        <div
                                            key={component.importPath}
                                            className='px-2 py-1 text-xs flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors'
                                        >
                                            <span className='text-gray-700 dark:text-gray-300 truncate'>
                                                {component.name}
                                            </span>
                                            <button
                                                onClick={() => openInPlayground(component)}
                                                className='px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors flex-shrink-0'
                                            >
                                                Open
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
