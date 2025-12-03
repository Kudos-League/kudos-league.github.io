import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MobileChatContextType {
    isInMobileChat: boolean;
    setIsInMobileChat: (value: boolean) => void;
}

const MobileChatContext = createContext<MobileChatContextType | undefined>(undefined);

export const MobileChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isInMobileChat, setIsInMobileChat] = useState(false);

    return (
        <MobileChatContext.Provider value={{ isInMobileChat, setIsInMobileChat }}>
            {children}
        </MobileChatContext.Provider>
    );
};

export const useMobileChat = () => {
    const context = useContext(MobileChatContext);
    if (context === undefined) {
        throw new Error('useMobileChat must be used within a MobileChatProvider');
    }
    return context;
};
