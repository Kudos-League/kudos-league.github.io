import React, { useState } from 'react';
import { useLogCollector } from '@/hooks/useLogCollector';
import type { Recording } from '@/services/logCollector/types';

const RecordingRow = React.memo(
    ({ recording, onDelete, onExportText, onExportJson, onRemoveLog }: {
        recording: Recording;
        onDelete: (id: string) => void;
        onExportText: (id: string) => void;
        onExportJson: (id: string) => void;
        onRemoveLog: (recordingId: string, logIndex: number) => void;
    }) => {
        const [expanded, setExpanded] = useState(false);

        return (
            <div className='border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors'>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className='w-full text-left px-3 py-2 focus:outline-none'
                >
                    <div className='flex items-center gap-2 text-xs'>
                        <span className='text-gray-900 dark:text-gray-100 flex-1'>
                            {recording.name}
                        </span>
                        <span className='text-gray-500 dark:text-gray-400'>
                            {recording.logs.length} logs
                        </span>
                        <span className='text-gray-400 dark:text-gray-500'>
                            {expanded ? '▼' : '▶'}
                        </span>
                    </div>
                </button>

                {expanded && (
                    <div className='bg-gray-100 dark:bg-slate-900 px-3 py-3 border-t border-gray-200 dark:border-gray-700 space-y-3'>
                        <div className='text-xs text-gray-600 dark:text-gray-300'>
                            <div>
                                <span className='font-semibold'>Created:</span> {new Date(recording.createdAt).toLocaleString()}
                            </div>
                            <div>
                                <span className='font-semibold'>Logs:</span> {recording.logs.length}
                            </div>
                        </div>

                        {/* Log Entries */}
                        {recording.logs.length > 0 && (
                            <div className='space-y-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 p-2 rounded border border-gray-300 dark:border-gray-600'>
                                {recording.logs.map((entry, index) => (
                                    <div key={index} className='text-xs text-gray-700 dark:text-gray-300 font-mono flex items-center justify-between gap-2 hover:bg-gray-100 dark:hover:bg-slate-700 p-1 rounded'>
                                        <div className='flex-1 truncate'>{index + 1}. {entry.context}</div>
                                        <button
                                            onClick={() => onRemoveLog(recording.id, index)}
                                            className='flex-shrink-0 px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs transition-colors'
                                            title='Remove from recording'
                                        >
                                            −
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className='flex gap-2'>
                            <button
                                onClick={() => onExportText(recording.id)}
                                className='flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors'
                            >
                                Export Text
                            </button>
                            <button
                                onClick={() => onExportJson(recording.id)}
                                className='flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors'
                            >
                                Export JSON
                            </button>
                            <button
                                onClick={() => onDelete(recording.id)}
                                className='flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors'
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

RecordingRow.displayName = 'RecordingRow';

export default function RecordingsSection() {
    const { recordings, startRecording, stopRecording, isRecording, deleteRecording, exportRecordingAsText, exportRecordingAsJson, removeLogFromRecording } =
        useLogCollector();
    const [showNewRecordingInput, setShowNewRecordingInput] = useState(false);
    const [newRecordingName, setNewRecordingName] = useState('');

    const handleExportText = (recordingId: string) => {
        const text = exportRecordingAsText(recordingId);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${recordingId}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportJson = (recordingId: string) => {
        const json = exportRecordingAsJson(recordingId);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${recordingId}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCreateRecording = () => {
        if (newRecordingName.trim()) {
            startRecording(newRecordingName);
            setNewRecordingName('');
            setShowNewRecordingInput(false);
        }
    };

    const handleDeleteRecording = (id: string) => {
        if (window.confirm('Delete this recording? This cannot be undone.')) {
            deleteRecording(id);
        }
    };

    const handleRemoveLogFromRecording = (recordingId: string, logIndex: number) => {
        removeLogFromRecording(recordingId, logIndex);
    };

    return (
        <div className='space-y-3 h-full flex flex-col'>
            {/* Header with controls */}
            <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                    <button
                        onClick={() => setShowNewRecordingInput(!showNewRecordingInput)}
                        className='px-2 py-1 text-xs font-medium rounded transition-colors bg-blue-600 hover:bg-blue-700 text-white'
                    >
                        + New Recording
                    </button>
                    <span className='text-xs text-gray-600 dark:text-gray-400 font-semibold'>
                        {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {showNewRecordingInput && (
                    <div className='flex gap-2'>
                        <input
                            type='text'
                            placeholder='Recording name...'
                            value={newRecordingName}
                            onChange={(e) => setNewRecordingName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateRecording();
                                if (e.key === 'Escape') {
                                    setShowNewRecordingInput(false);
                                    setNewRecordingName('');
                                }
                            }}
                            className='flex-1 px-2 py-1 text-xs bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100'
                            autoFocus
                        />
                        <button
                            onClick={handleCreateRecording}
                            className='px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors'
                        >
                            Create
                        </button>
                        <button
                            onClick={() => {
                                setShowNewRecordingInput(false);
                                setNewRecordingName('');
                            }}
                            className='px-2 py-1 text-xs bg-gray-400 hover:bg-gray-500 text-white rounded transition-colors'
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Recordings List */}
            <div className='flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-slate-800'>
                {recordings.length > 0 ? (
                    <div>
                        {recordings.map((recording) => (
                            <RecordingRow
                                key={recording.id}
                                recording={recording}
                                onDelete={handleDeleteRecording}
                                onExportText={handleExportText}
                                onExportJson={handleExportJson}
                                onRemoveLog={handleRemoveLogFromRecording}
                            />
                        ))}
                    </div>
                ) : (
                    <div className='flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm'>
                        No recordings yet. Start recording logs to create one.
                    </div>
                )}
            </div>
        </div>
    );
}
