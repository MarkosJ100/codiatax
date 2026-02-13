import { createClient } from '@supabase/supabase-js';
import { ENV } from './config/env';
import supabaseStorage from './utils/supabaseStorage';

// Credentials are now validated in config/env.ts


export const supabase = createClient(
    ENV.SUPABASE_URL,
    ENV.SUPABASE_ANON_KEY,
    {
        auth: {
            storage: supabaseStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    }
);
