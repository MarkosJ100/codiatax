import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface ToastMessage {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

interface UIContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    toast: ToastMessage | null;
    showToast: (message: string, type?: ToastMessage['type']) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Theme State
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const saved = localStorage.getItem('codiatax_theme');
        return (saved === 'light' || saved === 'dark') ? saved : 'light';
    });

    // Toast State
    const [toast, setToast] = useState<ToastMessage | null>(null);

    // Persistence for Theme
    useEffect(() => {
        localStorage.setItem('codiatax_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }, []);

    const showToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    return (
        <UIContext.Provider value={{ theme, toggleTheme, toast, showToast }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
