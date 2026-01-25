import { useEffect, useState, useCallback } from 'react';
import LogCollectorService from '@/services/logCollector/LogCollectorService';
import { LogEntry, LogFilter, Recording } from '@/services/logCollector/types';

interface UseLogCollectorReturn {
    logs: LogEntry[];
    filteredLogs: LogEntry[];
    clearLogs: () => void;
    exportLogs: () => string;
    filterLogs: (filter: LogFilter) => LogEntry[];
    isPaused: boolean;
    setPaused: (paused: boolean) => void;
    statistics: {
        total: number;
        console: number;
        network: number;
        websocket: number;
        reactQuery: number;
        errors: number;
        warnings: number;
    };
    // Recording functionality
    recordings: Recording[];
    isRecording: boolean;
    startRecording: (name?: string) => string;
    stopRecording: () => void;
    addLogToRecording: (recordingId: string, logId: string) => void;
    removeLogFromRecording: (recordingId: string, logIndex: number) => void;
    deleteRecording: (recordingId: string) => void;
    exportRecordingAsText: (recordingId: string) => string;
    exportRecordingAsJson: (recordingId: string) => string;
}

/**
 * Hook to access LogCollectorService
 * Automatically subscribes to log updates
 */
export function useLogCollector(): UseLogCollectorReturn {
    const service = LogCollectorService.getInstance();
    const [logs, setLogs] = useState<LogEntry[]>(service.getLogs());
    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(
        service.getLogs()
    );
    const [statistics, setStatistics] = useState(service.getStatistics());
    const [recordings, setRecordings] = useState<Recording[]>(
        service.getRecordings()
    );
    const [isRecording, setIsRecording] = useState(service.getIsRecording());

    // Subscribe to log changes on mount
    useEffect(() => {
        const unsubscribe = service.subscribe((updatedLogs) => {
            setLogs(updatedLogs);
            setFilteredLogs(updatedLogs); // Reset filtered logs when new logs come in
            setStatistics(service.getStatistics());
        });

        // Cleanup subscription on unmount
        return () => {
            unsubscribe();
        };
    }, [service]);

    // Subscribe to recording changes on mount
    useEffect(() => {
        const unsubscribe = service.subscribeToRecordings(
            (updatedRecordings) => {
                setRecordings(updatedRecordings);
                setIsRecording(service.getIsRecording());
            }
        );

        // Cleanup subscription on unmount
        return () => {
            unsubscribe();
        };
    }, [service]);

    const clearLogs = useCallback(() => {
        service.clearLogs();
    }, [service]);

    const exportLogs = useCallback(() => {
        return service.exportLogs();
    }, [service]);

    const filterLogs = useCallback(
        (filter: LogFilter): LogEntry[] => {
            const filtered = service.filterLogs(filter);
            setFilteredLogs(filtered);
            return filtered;
        },
        [service]
    );

    const setPaused = useCallback(
        (paused: boolean) => {
            service.setPaused(paused);
        },
        [service]
    );

    const startRecording = useCallback(
        (name?: string) => {
            return service.startRecording(name);
        },
        [service]
    );

    const stopRecording = useCallback(() => {
        service.stopRecording();
    }, [service]);

    const addLogToRecording = useCallback(
        (recordingId: string, logId: string) => {
            service.addLogToRecording(recordingId, logId);
        },
        [service]
    );

    const removeLogFromRecording = useCallback(
        (recordingId: string, logIndex: number) => {
            service.removeLogFromRecording(recordingId, logIndex);
        },
        [service]
    );

    const deleteRecording = useCallback(
        (recordingId: string) => {
            service.deleteRecording(recordingId);
        },
        [service]
    );

    const exportRecordingAsText = useCallback(
        (recordingId: string) => {
            return service.exportRecordingAsText(recordingId);
        },
        [service]
    );

    const exportRecordingAsJson = useCallback(
        (recordingId: string) => {
            return service.exportRecordingAsJson(recordingId);
        },
        [service]
    );

    return {
        logs,
        filteredLogs,
        clearLogs,
        exportLogs,
        filterLogs,
        isPaused: service.getPaused(),
        setPaused,
        statistics,
        recordings,
        isRecording,
        startRecording,
        stopRecording,
        addLogToRecording,
        removeLogFromRecording,
        deleteRecording,
        exportRecordingAsText,
        exportRecordingAsJson
    };
}
