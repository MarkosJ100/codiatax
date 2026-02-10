import { Preferences } from '@capacitor/preferences';
import { SupportedStorage } from '@supabase/supabase-js';

const supabaseStorage: SupportedStorage = {
    getItem: async (key: string): Promise<string | null> => {
        const { value } = await Preferences.get({ key });
        return value;
    },
    setItem: async (key: string, value: string): Promise<void> => {
        await Preferences.set({ key, value });
    },
    removeItem: async (key: string): Promise<void> => {
        await Preferences.remove({ key });
    },
};

export default supabaseStorage;
