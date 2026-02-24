import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { syncService, SyncItem } from './SyncService';

describe('SyncService', () => {
    beforeEach(() => {
        localStorage.clear();
        // Reset the singleton internal state for clean testing
        (syncService as any).queue = [];
        (syncService as any).isProcessing = false;

        // Mock navigator.onLine
        vi.stubGlobal('navigator', { onLine: true });
        // Mock setInterval and clearInterval to prevent background processing during tests
        vi.stubGlobal('setInterval', vi.fn(() => 123)); // Return a dummy interval ID
        vi.stubGlobal('clearInterval', vi.fn());

        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals(); // Clean up stubbed globals like navigator, setInterval, clearInterval
    });

    it('should add items to the queue and persist to localStorage', () => {
        // Force offline to test queueing
        vi.stubGlobal('navigator', { onLine: false });

        const item: any = {
            entityId: 1,
            entityType: 'SERVICE',
            operation: 'CREATE',
            data: { test: true },
            userName: 'user'
        };

        syncService.addToQueue(item);

        const status = syncService.getQueueStatus();
        expect(status.pending).toBe(1);

        const saved = JSON.parse(localStorage.getItem('codiatax_sync_queue') || '[]');
        expect(saved).toHaveLength(1);
        expect(saved[saved.length - 1].data.test).toBe(true);
    });

    it('should notify listeners on change', () => {
        const callback = vi.fn();
        syncService.subscribe(callback);

        // Initial call on subscribe
        expect(callback).toHaveBeenCalledWith({ pending: 0, isSyncing: false, lastError: null });

        syncService.addToQueue({
            entityId: 1,
            entityType: 'SERVICE',
            operation: 'DELETE',
            data: null,
            userName: 'user'
        } as any);

        // Should have been called again after addToQueue
        // (Possible 3 calls: 1 initial, 1 when adding to queue, 1 when handling sync processing status)
        expect(callback).toHaveBeenCalledTimes(3);
        expect(callback).toHaveBeenLastCalledWith({ pending: 1, isSyncing: expect.any(Boolean), lastError: null });
    });
});
