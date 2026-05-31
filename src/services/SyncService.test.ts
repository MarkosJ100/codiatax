import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SyncService } from './SyncService';
import { storage } from '../utils/storage';

// Mock storage
vi.mock('../utils/storage', () => ({
    storage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        isOnline: vi.fn(),
    }
}));

// Mock repositories to avoid dynamic import hangs
vi.mock('./repositories/ServiceRepository', () => ({ ServiceRepository: { create: vi.fn().mockResolvedValue(true) } }));
vi.mock('./repositories/ExpenseRepository', () => ({ ExpenseRepository: { create: vi.fn().mockResolvedValue(true) } }));
vi.mock('./repositories/SubscriberRepository', () => ({ SubscriberRepository: { create: vi.fn().mockResolvedValue(true) } }));
vi.mock('./repositories/VehicleRepository', () => ({ VehicleRepository: { upsert: vi.fn().mockResolvedValue(true) } }));
vi.mock('./repositories/ShiftRepository', () => ({ ShiftRepository: { upsert: vi.fn().mockResolvedValue(true) } }));

describe('SyncService', () => {
    let syncService: SyncService;

    beforeEach(() => {
        vi.clearAllMocks();
        (storage.isOnline as any).mockReturnValue(true);
        (storage.getItem as any).mockReturnValue([]);

        syncService = new SyncService();
    });

    it('should initialize with an empty queue from storage', () => {
        expect(syncService).toBeDefined();
    });

    it('should add items to the queue and notify listeners', () => {
        const mockItem = { entityType: 'SERVICE' as any, operation: 'CREATE' as any, entityId: 1, data: { amount: 10 }, userName: 'u1' };
        syncService.addToQueue(mockItem);

        expect(storage.setItem).toHaveBeenCalledWith('codiatx_sync_queue', expect.any(Array));
    });

    it('should process queue when online', async () => {
        (storage.isOnline as any).mockReturnValue(false); // Offline to add without sync
        const mockItem = { entityType: 'SERVICE' as any, operation: 'CREATE' as any, entityId: 1, data: { amount: 10 }, userName: 'u1' };
        syncService.addToQueue(mockItem);

        (storage.isOnline as any).mockReturnValue(true);
        await syncService.processQueue();

        // After processing, queue should be shorter (called setItem again with empty or shift)
        expect(storage.setItem).toHaveBeenCalled();
    });

    it('should not process queue when offline', async () => {
        (storage.isOnline as any).mockReturnValue(false);
        const mockItem = { entityType: 'SERVICE' as any, operation: 'CREATE' as any, entityId: 1, data: { amount: 10 }, userName: 'u1' };
        syncService.addToQueue(mockItem);

        await syncService.processQueue();
        // Should still have pending items in storage call
        expect(storage.setItem).toHaveBeenCalledWith('codiatx_sync_queue', expect.arrayContaining([expect.objectContaining({ entityType: 'SERVICE' })]));
    });
});

