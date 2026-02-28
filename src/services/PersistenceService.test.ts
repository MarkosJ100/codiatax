import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PersistenceService } from './PersistenceService';
import { storage } from '../utils/storage';
import { DataRepository } from './repositories/DataRepository';

vi.mock('../utils/storage', () => ({
    storage: {
        clearAll: vi.fn(),
        setItem: vi.fn(),
    }
}));

vi.mock('./repositories/DataRepository', () => ({
    DataRepository: {
        resetAllData: vi.fn().mockResolvedValue(true),
    }
}));

describe('PersistenceService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('resetAppData', () => {
        it('should clear local storage and call repository if username provided', async () => {
            const result = await PersistenceService.resetAppData('testUser');
            expect(result.success).toBe(true);
            expect(storage.clearAll).toHaveBeenCalled();
            expect(DataRepository.resetAllData).toHaveBeenCalledWith('testUser');
        });

        it('should only clear local storage if no username provided', async () => {
            const result = await PersistenceService.resetAppData();
            expect(result.success).toBe(true);
            expect(storage.clearAll).toHaveBeenCalled();
            expect(DataRepository.resetAllData).not.toHaveBeenCalled();
        });

        it('should return failure if error occurs', async () => {
            (storage.clearAll as any).mockImplementation(() => { throw new Error('storage error'); });
            const result = await PersistenceService.resetAppData();
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('restoreAppData', () => {
        it('should set items for each present category in backup', async () => {
            const mockBackup = {
                services: [{ id: 1 } as any],
                expenses: [{ id: 101 } as any],
            };
            const result = await PersistenceService.restoreAppData(mockBackup);
            expect(result.success).toBe(true);
            expect(storage.setItem).toHaveBeenCalledWith('codiatax_services', mockBackup.services);
            expect(storage.setItem).toHaveBeenCalledWith('codiatax_expenses', mockBackup.expenses);
        });

        it('should handle partial backups', async () => {
            const mockBackup = { vehicle: { model: 'Taxi' } as any };
            const result = await PersistenceService.restoreAppData(mockBackup);
            expect(result.success).toBe(true);
            expect(storage.setItem).toHaveBeenCalledWith('codiatax_vehicle', mockBackup.vehicle);
            expect(storage.setItem).not.toHaveBeenCalledWith('codiatax_services', expect.anything());
        });
    });
});
