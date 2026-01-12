import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DMsContextType {
    isOpen: boolean;
    selectedUserId: number | null;
    openDMs: (userId?: number) => void;
    closeDMs: () => void;
}

const DMsContext = createContext<DMsContextType | undefined>(undefined);

export const DMsProvider: React.FC<{ children: ReactNode }> = ({
    children
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    const openDMs = (userId?: number) => {
        setIsOpen(true);
        if (userId) {
            setSelectedUserId(userId);
        }
    };

    const closeDMs = () => {
        setIsOpen(false);
        // Keep selectedUserId so it can be used when reopening
    };

    return (
        <DMsContext.Provider
            value={{ isOpen, selectedUserId, openDMs, closeDMs }}
        >
            {children}
        </DMsContext.Provider>
    );
};

export const useDMs = () => {
    const context = useContext(DMsContext);
    if (context === undefined) {
        throw new Error('useDMs must be used within a DMsProvider');
    }
    return context;
};
