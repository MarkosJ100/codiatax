const getEnvVar = (key: string): string => {
    const value = import.meta.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

export const ENV = {
    SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL'),
    SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY'),
};
