import { Service, Expense, Vehicle, ShiftStorage } from '../types';
import { DataRepository } from '../services/repositories/DataRepository';

export interface LoaderData {
    services: Service[];
    expenses: Expense[];
    vehicle: Vehicle | null;
    shiftStorage: ShiftStorage | null;
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
        const data = await DataRepository.fetchInitialAppData(userId);
        return {
            services: data.services || [],
            expenses: data.expenses || [],
            vehicle: data.vehicle,
            shiftStorage: data.shiftStorage
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
