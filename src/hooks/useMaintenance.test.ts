import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMaintenance } from './useMaintenance';
import { Vehicle } from '../types';

describe('useMaintenance', () => {
    const mockVehicle: Vehicle = {
        licensePlate: '1234ABC',
        model: 'Toyota Prius',
        initialOdometer: 100000,
        maintenance: {
            oil: { name: 'Aceite', lastKm: 100000, interval: 15000 },
            tires: { name: 'Neumáticos', lastKm: 100000, interval: 40000 },
            brakes: { name: 'Frenos', lastKm: 100000, interval: 30000 }
        }
    };

    it('should calculate correct status when no progress is made', () => {
        const { result } = renderHook(() => useMaintenance(mockVehicle, 100000));

        const oilStatus = result.current.maintenanceStatuses.find(s => s.name === 'Aceite');
        expect(oilStatus?.progress).toBe(0);
        expect(oilStatus?.remaining).toBe(15000);
    });

    it('should calculate correct status with progress', () => {
        const { result } = renderHook(() => useMaintenance(mockVehicle, 107500)); // Halfway for oil

        const oilStatus = result.current.maintenanceStatuses.find(s => s.name === 'Aceite');
        expect(oilStatus?.progress).toBe(50);
        expect(oilStatus?.remaining).toBe(7500);
    });

    it('should cap progress at 100 if overdue', () => {
        const { result } = renderHook(() => useMaintenance(mockVehicle, 120000)); // Overdue by 5000

        const oilStatus = result.current.maintenanceStatuses.find(s => s.name === 'Aceite');
        expect(oilStatus?.progress).toBe(100);
        expect(oilStatus?.remaining).toBe(0); // Capped at 0 in implementation
    });

    it('should handle missing maintenance keys gracefully', () => {
        const incompleteVehicle: any = { ...mockVehicle, maintenance: {} };
        const { result } = renderHook(() => useMaintenance(incompleteVehicle, 100000));
        expect(result.current.maintenanceStatuses).toHaveLength(0);
    });
});
