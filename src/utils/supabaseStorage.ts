import { SupportedStorage } from '@supabase/supabase-js';

const canUseLocalStorage = () => {
    try {
        return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
        return false;
    }
};

const supabaseStorage: SupportedStorage = {
    getItem: async (key: string): Promise<string | null> => {
        if (!canUseLocalStorage()) return null;
        try {
            return window.localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (!canUseLocalStorage()) return;
        try {
            window.localStorage.setItem(key, value);
        } catch {
            // no-op: avoid startup crash on restricted webviews
        }
    },
    removeItem: async (key: string): Promise<void> => {
        if (!canUseLocalStorage()) return;
        try {
            window.localStorage.removeItem(key);
        } catch {
            // no-op: avoid startup crash on restricted webviews
        }
    },
};

export default supabaseStorage;
