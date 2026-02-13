import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Vehicle, MaintenanceItem } from '../types';
import { supabase } from '../supabase';
import { normalizeUsername } from '../utils/userHelpers';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';

interface VehicleContextType {
    vehicle: Vehicle;
    setVehicle: React.Dispatch<React.SetStateAction<Vehicle>>;
    currentOdometer: number;
    setInitialOdometer: (km: string | number) => void;
    mileageLogs: any[];
    addMileageLog: (log: any) => void;
    updateMaintenance: (key: string, lastKm: number) => void;
    addMaintenanceItem: (key: string, data: MaintenanceItem) => void;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { showToast } = useUI();

    const [vehicle, setVehicle] = useState<Vehicle>(() => {
        // Default initialization logic (same as AppContext)
        const defaultVehicle: Vehicle = {
            licensePlate: '',
            model: '',
            initialOdometer: 0,
            maintenance: {
                oil: { name: 'Aceite', lastKm: 0, interval: 15000 },
                tires: { name: 'Neumáticos', lastKm: 0, interval: 40000 },
                brakes: { name: 'Frenos', lastKm: 0, interval: 30000 }
            }
        };
        try {
            const saved = localStorage.getItem('codiatax_vehicle');
            const parsed = saved ? JSON.parse(saved) : null;
            if (parsed && typeof parsed === 'object' && parsed.maintenance) return parsed as Vehicle;
            return defaultVehicle;
        } catch { return defaultVehicle; }
    });

    const [mileageLogs, setMileageLogs] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('codiatax_mileage');
            const parsed = saved ? JSON.parse(saved) : null;
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    });

    // Derived state
    const currentOdometer = useMemo(() => {
        const baseKm = vehicle.initialOdometer || 0;
        const totalMileage = mileageLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
        return baseKm + totalMileage;
    }, [vehicle.initialOdometer, mileageLogs]);

    // Persistence
    useEffect(() => {
        const timeout = setTimeout(() => {
            localStorage.setItem('codiatax_vehicle', JSON.stringify(vehicle));
            if (user) {
                const uid = normalizeUsername(user.name);
                supabase.from('vehiculos').upsert({
                    license_plate: vehicle.licensePlate,
                    model: vehicle.model,
                    initial_odometer: vehicle.initialOdometer,
                    maintenance_data: vehicle.maintenance,
                    user_id: uid
                }).then(({ error }) => { if (error) console.warn('Vehicle sync failed', error); });
            }
        }, 2000);
        return () => clearTimeout(timeout);
    }, [vehicle, user]);

    useEffect(() => {
        localStorage.setItem('codiatax_mileage', JSON.stringify(mileageLogs));
    }, [mileageLogs]);

    // Sync Fetch Logic for Vehicle (Simplified)
    useEffect(() => {
        if (user) {
            const uid = normalizeUsername(user.name);
            supabase.from('vehiculos').select('*').eq('user_id', uid).maybeSingle()
                .then(({ data }) => {
                    if (data) {
                        setVehicle({
                            licensePlate: data.license_plate,
                            model: data.model,
                            initialOdometer: data.initial_odometer,
                            maintenance: data.maintenance_data
                        });
                    }
                });
        }
    }, [user]);


    const setInitialOdometer = (km: string | number) => {
        setVehicle(prev => ({ ...prev, initialOdometer: parseInt(km.toString()) }));
    };

    const addMileageLog = (log: any) => {
        setMileageLogs(prev => [...prev, { ...log, id: Date.now() }]);
        // Note: Mileage is not currently synced to Supabase in AppContext, limiting scope to match original behavior for now
    };

    const updateMaintenance = (key: string, lastKm: number) => {
        setVehicle(prev => ({
            ...prev,
            maintenance: {
                ...prev.maintenance,
                [key]: { ...prev.maintenance[key], lastKm }
            }
        }));
    };

    const addMaintenanceItem = (key: string, data: MaintenanceItem) => {
        setVehicle(prev => ({
            ...prev,
            maintenance: { ...prev.maintenance, [key]: data }
        }));
    };

    return (
        <VehicleContext.Provider value={{
            vehicle, setVehicle, currentOdometer, setInitialOdometer,
            mileageLogs, addMileageLog, updateMaintenance, addMaintenanceItem
        }}>
            {children}
        </VehicleContext.Provider>
    );
};

export const useVehicle = () => {
    const context = useContext(VehicleContext);
    if (!context) throw new Error('useVehicle must be used within VehicleProvider');
    return context;
};
