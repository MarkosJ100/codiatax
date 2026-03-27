import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ShiftStorage, AirportShift, ShiftType, UserShiftConfig } from '../types';
import { calculateAirportCycle, filterFutureAssignments } from '../utils/airportLogic';
import { useAuth } from './AuthContext';
import { ShiftRepository } from '../services/repositories/ShiftRepository';
import { storage } from '../utils/storage';
import { ShiftService } from '../services/ShiftService';

let syncServicePromise: Promise<typeof import('../services/SyncService')> | null = null;
const getSyncService = async () => {
    if (!syncServicePromise) {
        syncServicePromise = import('../services/SyncService');
    }
    return (await syncServicePromise).syncService;
};

interface ShiftContextType {
    shiftStorage: ShiftStorage;
    toggleAirportShift: (dateStr: string, type?: string, userName?: string | null) => { success: boolean, action?: string, type?: string, error?: string };
    toggleRestDay: (dateStr: string) => void;
    checkShiftCollision: (week: string, type: ShiftType, currentUserName: string) => string | null;
    saveUserShiftConfig: (config: UserShiftConfig) => void;
    getShiftForDate: (date: Date) => any;
    generateAirportCycle: (startDateStr: string, type?: string) => { success: boolean, count?: number, error?: string };
    clearFutureAirportShifts: (fromDateStr: string) => { success: boolean, error?: string };
    undoLastAction: () => { success: boolean };
    undoBuffer: AirportShift[] | null;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    const [shiftStorage, setShiftStorage] = useState<ShiftStorage>(() => {
        return storage.getItem<ShiftStorage>('codiatx_shift_storage', { assignments: [], restDays: [], userConfigs: [] });
    });

    const [undoBuffer, setUndoBuffer] = useState<AirportShift[] | null>(null);

    // Persistence & Sync
    useEffect(() => {
        storage.setItem('codiatx_shift_storage', shiftStorage);
        if (user) {
            const sync = async () => {
                try {
                    if (storage.isOnline()) {
                        await ShiftRepository.upsert(shiftStorage, user.name);
                    } else {
                        throw new Error('Offline');
                    }
                } catch (e) {
                    const syncService = await getSyncService();
                    syncService.addToQueue({
                        entityId: 'current',
                        entityType: 'SHIFT',
                        operation: 'UPSERT',
                        data: shiftStorage,
                        userName: user.name
                    });
                }
            };
            sync();
        }
    }, [shiftStorage, user]);

    // Fetch
    useEffect(() => {
        if (user) {
            ShiftRepository.get(user.name).then(cloudStorage => {
                if (cloudStorage) setShiftStorage(cloudStorage);
            }).catch(e => console.warn('Shift fetch failed', e));
        }
    }, [user]);

    const toggleAirportShift = (dateStr: string, type: string = 'standard', userName: string | null = null) => {
        const targetUser = userName || user?.name;
        if (!targetUser) return { success: false, error: 'User name required' };

        const assignments = shiftStorage.assignments || [];
        const isAlreadyAssigned = assignments.some(a => a.date === dateStr && a.userId === targetUser);

        setShiftStorage(prev => ({
            ...prev,
            assignments: ShiftService.toggleAssignment(prev.assignments || [], dateStr, targetUser, type)
        }));

        return {
            success: true,
            action: isAlreadyAssigned ? 'removed' : 'added',
            type
        };
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
        return ShiftService.getCollision(shiftStorage.userConfigs || [], week, type, currentUserName);
    };

    const saveUserShiftConfig = (config: any) => {
        setShiftStorage(prev => {
            const other = (prev.userConfigs || []).filter(c => c.userName !== config.userName);
            return { ...prev, userConfigs: [...other, config] };
        });
    };

    const getShiftForDate = useCallback((date: Date) => {
        if (!user) return { type: 'libre', label: 'Servicio Libre' };
        if (user.workMode === 'solo') return { type: 'libre', label: 'Conductor Ãšnico', isSolo: true };
        return { type: 'maÃ±ana', startTime: '06:00', endTime: '15:00' };
    }, [user]);

    const generateAirportCycle = (startDateStr: string, type: string = 'standard') => {
        if (!user) return { success: false, error: 'User required' };
        setUndoBuffer(shiftStorage.assignments);

        const future = ShiftService.clearFutureAssignments(shiftStorage.assignments || [], user.name, startDateStr);
        const newItems = ShiftService.generateCycle(startDateStr, user.name, type);

        if (newItems.length === 0) return { success: false, error: 'Invalid date' };
        setShiftStorage(prev => ({ ...prev, assignments: [...future, ...newItems] }));
        return { success: true, count: newItems.length };
    };

    const clearFutureAirportShifts = (fromDateStr: string) => {
        if (!user) return { success: false, error: 'User required' };
        setUndoBuffer(shiftStorage.assignments);
        setShiftStorage(prev => ({
            ...prev,
            assignments: ShiftService.clearFutureAssignments(prev.assignments || [], user.name, fromDateStr)
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
            clearFutureAirportShifts, undoLastAction, undoBuffer
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

