import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
    useDyslexicFont: boolean;
    setUseDyslexicFont: (value: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [useDyslexicFont, setUseDyslexicFontState] = useState(() => {
        const stored = localStorage.getItem('useDyslexicFont');
        return stored === 'true';
    });

    useEffect(() => {
        // Apply or remove dyslexic font class to document root
        if (useDyslexicFont) {
            document.documentElement.classList.add('dyslexic-font');
        } 
        else {
            document.documentElement.classList.remove('dyslexic-font');
        }
    }, [useDyslexicFont]);

    const setUseDyslexicFont = (value: boolean) => {
        setUseDyslexicFontState(value);
        localStorage.setItem('useDyslexicFont', String(value));
    };

    return (
        <AccessibilityContext.Provider value={{ useDyslexicFont, setUseDyslexicFont }}>
            {children}
        </AccessibilityContext.Provider>
    );
};

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
};
