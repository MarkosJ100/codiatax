import { supabase } from '../supabase';

export interface LoaderData {
    services: any[];
    expenses: any[];
    vehicle: any | null;
    shiftStorage: any | null;
}

/**
 * Main data loader for the application.
 * Fetches user data from Supabase in parallel before rendering.
 */
export async function appDataLoader(userId: string | null): Promise<LoaderData> {
    if (!userId) {
        return { services: [], expenses: [], vehicle: null, shiftStorage: null };
    }

    try {
        const [
            { data: sData },
            { data: eData },
            { data: vData },
            { data: tData }
        ] = await Promise.all([
            supabase.from('servicios').select('*').eq('user_id', userId),
            supabase.from('gastos').select('*').eq('user_id', userId),
            supabase.from('vehiculos').select('*').eq('user_id', userId).maybeSingle(),
            supabase.from('turnos_storage').select('*').eq('user_id', userId).maybeSingle()
        ]);

        return {
            services: sData || [],
            expenses: eData || [],
            vehicle: vData ? {
                licensePlate: vData.license_plate,
                model: vData.model,
                initialOdometer: vData.initial_odometer,
                maintenance: vData.maintenance_data
            } : null,
            shiftStorage: tData?.data_json || null
        };
    } catch (err) {
        console.warn('Loader failed (offline?):', err);
        return { services: [], expenses: [], vehicle: null, shiftStorage: null };
    }
}

/**
 * Get user from localStorage for initial route decision.
 */
export function getUserFromStorage(): any | null {
    try {
        const saved = localStorage.getItem('codiatax_user');
        return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}
