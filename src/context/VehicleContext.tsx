import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { VehicleData, MaintenanceItem, MileageLog } from '../types';
import { useAuth } from './AuthContext';
import { VehicleRepository } from '../services/repositories/VehicleRepository';
import { storage } from '../utils/storage';
import { syncService } from '../services/SyncService';

interface VehicleContextType {
    vehicle: VehicleData;
    setVehicle: React.Dispatch<React.SetStateAction<VehicleData>>;
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

    const [vehicle, setVehicle] = useState<VehicleData>(() => {
        const defaultVehicle: VehicleData = {
            licensePlate: '',
            model: '',
            initialOdometer: 0,
            maintenance: {
                oil: { name: 'Aceite', lastKm: 0, interval: 15000 },
                tires: { name: 'Neumáticos', lastKm: 0, interval: 40000 },
                brakes: { name: 'Frenos', lastKm: 0, interval: 30000 }
            }
        };
        const saved = storage.getItem<VehicleData>('codiatax_vehicle', defaultVehicle);
        if (saved && typeof saved === 'object' && saved.maintenance) return saved;
        return defaultVehicle;
    });

    const [mileageLogs, setMileageLogs] = useState<MileageLog[]>(() => {
        return storage.getItem<MileageLog[]>('codiatax_mileage', []);
    });

    // Derived state
    const currentOdometer = useMemo(() => {
        const baseKm = vehicle.initialOdometer || 0;
        const totalMileage = mileageLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
        return baseKm + totalMileage;
    }, [vehicle.initialOdometer, mileageLogs]);

    // Persistence & Sync
    useEffect(() => {
        const timeout = setTimeout(async () => {
            storage.setItem('codiatax_vehicle', vehicle);

            if (user) {
                try {
                    if (storage.isOnline()) {
                        await VehicleRepository.upsert(vehicle, user.name);
                    } else {
                        throw new Error('Offline');
                    }
                } catch (e) {
                    syncService.addToQueue({
                        entityId: 'current',
                        entityType: 'VEHICLE',
                        operation: 'UPSERT',
                        data: vehicle,
                        userName: user.name
                    });
                }
            }
        }, 2000);
        return () => clearTimeout(timeout);
    }, [vehicle, user]);

    useEffect(() => {
        storage.setItem('codiatax_mileage', mileageLogs);
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

    const addMileageLog = (log: Omit<MileageLog, 'id'>) => {
        const newLog = { ...log, id: Date.now() } as MileageLog;
        setMileageLogs(prev => [...prev, newLog]);
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
