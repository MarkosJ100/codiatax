type PreferenceInput = { key: string; value?: string };

export const Preferences = {
    async get({ key }: PreferenceInput): Promise<{ value: string | null }> {
        try {
            return { value: localStorage.getItem(key) };
        } catch {
            return { value: null };
        }
    },
    async set({ key, value = '' }: PreferenceInput): Promise<void> {
        try {
            localStorage.setItem(key, value);
        } catch {
            // no-op for restricted storage contexts
        }
    },
    async remove({ key }: PreferenceInput): Promise<void> {
        try {
            localStorage.removeItem(key);
        } catch {
            // no-op for restricted storage contexts
        }
    }
};
