import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ShiftStorage, AirportShift, ShiftType } from '../types';
import { supabase } from '../supabase';
import { normalizeUsername } from '../utils/userHelpers';
import { calculateAirportCycle, filterFutureAssignments } from '../utils/airportLogic';
import { format } from '../utils/dateHelpers';
import { useAuth } from './AuthContext';

interface ShiftContextType {
    shiftStorage: ShiftStorage;
    toggleAirportShift: (dateStr: string, type?: string, userName?: string | null) => { success: boolean, action?: string, type?: string, error?: string };
    toggleRestDay: (dateStr: string) => void;
    checkShiftCollision: (week: string, type: ShiftType, currentUserName: string) => string | null;
    saveUserShiftConfig: (config: any) => void;
    getShiftForDate: (date: Date) => any;
    generateAirportCycle: (startDateStr: string, type?: string) => { success: boolean, count?: number, error?: string };
    clearFutureAirportShifts: (fromDateStr: string) => { success: boolean, error?: string };
    undoLastAction: () => { success: boolean };
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    const [shiftStorage, setShiftStorage] = useState<ShiftStorage>(() => {
        try {
            const saved = localStorage.getItem('codiatax_shift_storage');
            return saved ? JSON.parse(saved) : { assignments: [], restDays: [], userConfigs: [] };
        } catch { return { assignments: [], restDays: [], userConfigs: [] }; }
    });

    const [undoBuffer, setUndoBuffer] = useState<AirportShift[] | null>(null);

    // Persistence
    useEffect(() => {
        localStorage.setItem('codiatax_shift_storage', JSON.stringify(shiftStorage));
        if (user) {
            const uid = normalizeUsername(user.name);
            supabase.from('turnos_storage').upsert({
                user_id: uid,
                data_json: shiftStorage,
                updated_at: new Date().toISOString()
            }).then(({ error }) => { if (error) console.warn('Shift sync failed', error); });
        }
    }, [shiftStorage, user]);

    // Fetch
    useEffect(() => {
        if (user) {
            const uid = normalizeUsername(user.name);
            supabase.from('turnos_storage').select('*').eq('user_id', uid).maybeSingle()
                .then(({ data }) => {
                    if (data) setShiftStorage(data.data_json);
                });
        }
    }, [user]);

    // Logic from AppContext
    const toggleAirportShift = (dateStr: string, type: string = 'standard', userName: string | null = null) => {
        const targetUser = userName || user?.name;
        if (!targetUser) return { success: false, error: 'User name required' };

        const assignments = shiftStorage.assignments || [];
        const existing = assignments.find(a => a.date === dateStr && a.userId === targetUser);

        if (existing) {
            setShiftStorage(prev => ({
                ...prev,
                assignments: (prev.assignments || []).filter(a => !(a.date === dateStr && a.userId === targetUser))
            }));
            return { success: true, action: 'removed' };
        } else {
            setShiftStorage(prev => ({
                ...prev,
                assignments: [...assignments, { date: dateStr, userId: targetUser, type }]
            }));
            return { success: true, action: 'added', type };
        }
    };

    const toggleRestDay = (dateStr: string) => {
        setShiftStorage(prev => {
            const isRest = prev.restDays?.includes(dateStr);
            return {
                ...prev,
                restDays: isRest ? (prev.restDays || []).filter(d => d !== dateStr) : [...(prev.restDays || []), dateStr]
            };
        });
    };

    const checkShiftCollision = (week: string, type: ShiftType, currentUserName: string): string | null => {
        const configs = shiftStorage.userConfigs || [];
        const collision = configs.find(c => c.shiftWeek === week && c.shiftType === type && c.userName !== currentUserName);
        return collision ? collision.userName : null;
    };

    const saveUserShiftConfig = (config: any) => {
        setShiftStorage(prev => {
            const other = (prev.userConfigs || []).filter(c => c.userName !== config.userName);
            return { ...prev, userConfigs: [...other, config] };
        });
    };

    const getShiftForDate = useCallback((date: Date) => {
        if (!user) return { type: 'libre', label: 'Servicio Libre' };
        // Simplified logic for brevity, matches AppContext logic usually
        if (user.workMode === 'solo') return { type: 'libre', label: 'Conductor Único', isSolo: true };
        // ... complete logic would go here
        return { type: 'mañana', startTime: '06:00', endTime: '15:00' }; // Placeholder for now
    }, [user]);

    const generateAirportCycle = (startDateStr: string, type: string = 'standard') => {
        if (!user) return { success: false, error: 'User required' };
        setUndoBuffer(shiftStorage.assignments);
        const future = filterFutureAssignments(shiftStorage.assignments || [], user.name, startDateStr);
        const newItems = calculateAirportCycle(startDateStr, user.name, type);
        if (newItems.length === 0) return { success: false, error: 'Invalid date' };
        setShiftStorage(prev => ({ ...prev, assignments: [...future, ...newItems] }));
        return { success: true, count: newItems.length };
    };

    const clearFutureAirportShifts = (fromDateStr: string) => {
        if (!user) return { success: false, error: 'User required' };
        setUndoBuffer(shiftStorage.assignments);
        setShiftStorage(prev => ({
            ...prev, assignments: filterFutureAssignments(prev.assignments || [], user.name, fromDateStr)
        }));
        return { success: true };
    };

    const undoLastAction = () => {
        if (undoBuffer) {
            setShiftStorage(prev => ({ ...prev, assignments: undoBuffer }));
            setUndoBuffer(null);
            return { success: true };
        }
        return { success: false };
    };

    return (
        <ShiftContext.Provider value={{
            shiftStorage, toggleAirportShift, toggleRestDay, checkShiftCollision,
            saveUserShiftConfig, getShiftForDate, generateAirportCycle,
            clearFutureAirportShifts, undoLastAction
        }}>
            {children}
        </ShiftContext.Provider>
    );
};

export const useShifts = () => {
    const context = useContext(ShiftContext);
    if (!context) throw new Error('useShifts must be used within ShiftProvider');
    return context;
};
