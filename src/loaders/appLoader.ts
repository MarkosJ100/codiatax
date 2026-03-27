import { Service, Expense, Vehicle, ShiftStorage, User } from '../types';
import { DataRepository } from '../services/repositories/DataRepository';
import { supabase } from '../supabase';

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
        const saved = localStorage.getItem('codiatx_user') || localStorage.getItem('codiatax_user');
        if (!localStorage.getItem('codiatx_user') && saved) {
            localStorage.setItem('codiatx_user', saved);
            localStorage.removeItem('codiatax_user');
        }
        return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

/**
 * Fallback: strictly check the live Supabase session and reconstruct a basic user object.
 * This is used if the memory/localStorage user is missing (e.g. page refresh).
 */
export async function loadUserFromSupabaseSession(): Promise<User | null> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const metadata = session.user.user_metadata;
            const user: User = {
                name: metadata.name || '',
                role: metadata.role || 'propietario',
                licenseNumber: metadata.licenseNumber || '',
                // Add default properties if needed by the User type
                isShared: metadata.isShared || false,
                workMode: metadata.workMode || 'solo',
                shiftWeek: metadata.shiftWeek || 'Semana A',
                shiftType: metadata.shiftType || 'maÃ±ana',
                startTime: metadata.startTime || '06:00',
                endTime: metadata.endTime || '15:00',
                lastLogin: new Date().toISOString()
            };
            // Persist for next time
            localStorage.setItem('codiatx_user', JSON.stringify(user));
            localStorage.removeItem('codiatax_user');
            return user;
        }
        return null;
    } catch {
        return null;
    }
}

