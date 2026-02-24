import { useMemo } from 'react';
import { MaintenanceItem, Vehicle } from '../types';

export interface MaintenanceStatus {
    key: string;
    name: string;
    currentKm: number;
    lastKm: number;
    interval: number;
    progress: number;
    remaining: number;
    status: 'ok' | 'warning' | 'critical';
}

export const useMaintenance = (vehicle: Vehicle, currentOdometer: number) => {
    const maintenanceStatuses = useMemo(() => {
        if (!vehicle.maintenance) return [];

        return Object.entries(vehicle.maintenance).map(([key, item]: [string, MaintenanceItem]) => {
            const currentKm = currentOdometer - (item.lastKm || 0);
            const progress = (currentKm / item.interval) * 100;
            const remaining = item.interval - currentKm;

            let status: 'ok' | 'warning' | 'critical' = 'ok';
            if (progress >= 100) status = 'critical';
            else if (progress >= 80) status = 'warning';

            return {
                key,
                name: item.name,
                currentKm,
                lastKm: item.lastKm,
                interval: item.interval,
                progress: Math.min(progress, 100),
                remaining: Math.max(remaining, 0),
                status
            } as MaintenanceStatus;
        });
    }, [vehicle.maintenance, currentOdometer]);

    const hasCriticalIssues = useMemo(() =>
        maintenanceStatuses.some(s => s.status === 'critical'),
        [maintenanceStatuses]);

    const hasWarnings = useMemo(() =>
        maintenanceStatuses.some(s => s.status === 'warning'),
        [maintenanceStatuses]);

    return {
        maintenanceStatuses,
        hasCriticalIssues,
        hasWarnings
    };
};
