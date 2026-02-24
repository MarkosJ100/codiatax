import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Vehicle, MaintenanceItem, MileageLog } from '../types';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';
import { VehicleRepository } from '../services/repositories/VehicleRepository';

interface VehicleContextType {
    vehicle: Vehicle;
    setVehicle: React.Dispatch<React.SetStateAction<Vehicle>>;
    currentOdometer: number;
    setInitialOdometer: (km: string | number) => void;
    mileageLogs: MileageLog[];
    addMileageLog: (log: Omit<MileageLog, 'id'>) => void;
    updateMaintenance: (key: string, lastKm: number) => void;
    addMaintenanceItem: (key: string, data: MaintenanceItem) => void;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { showToast } = useUI();

    const [vehicle, setVehicle] = useState<Vehicle>(() => {
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
        const timeout = setTimeout(async () => {
            localStorage.setItem('codiatax_vehicle', JSON.stringify(vehicle));
            if (user) {
                try {
                    if (navigator.onLine) {
                        await VehicleRepository.upsert(vehicle, user.name);
                    } else {
                        throw new Error('Offline');
                    }
                } catch (e) {
                    import('../services/SyncService').then(({ syncService }) => {
                        syncService.addToQueue({
                            entityId: 'current',
                            entityType: 'VEHICLE',
                            operation: 'UPSERT',
                            data: vehicle,
                            userName: user.name
                        });
                    });
                }
            }
        }, 2000);
        return () => clearTimeout(timeout);
    }, [vehicle, user]);

    useEffect(() => {
        localStorage.setItem('codiatax_mileage', JSON.stringify(mileageLogs));
    }, [mileageLogs]);

    // Sync Fetch Logic
    useEffect(() => {
        if (user) {
            VehicleRepository.get(user.name).then(cloudVehicle => {
                if (cloudVehicle) setVehicle(cloudVehicle);
            }).catch(e => console.warn('Vehicle fetch failed', e));
        }
    }, [user]);


    const setInitialOdometer = (km: string | number) => {
        setVehicle(prev => ({ ...prev, initialOdometer: parseInt(km.toString()) }));
    };

    const addMileageLog = (log: any) => {
        setMileageLogs(prev => [...prev, { ...log, id: Date.now() }]);
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
