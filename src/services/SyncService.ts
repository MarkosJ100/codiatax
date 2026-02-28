import { storage } from '../utils/storage';
import { SyncItem, SyncStatus } from '../types/sync';

export class SyncService {
    private queue: SyncItem[] = [];
    private isProcessing = false;
    private lastError: string | null = null;
    private lastErrorType: SyncStatus['lastErrorType'] = 'UNKNOWN';
    private listeners: ((status: SyncStatus) => void)[] = [];

    constructor() {
        this.loadQueue();
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.processQueue());
        }
    }

    private loadQueue() {
        this.queue = storage.getItem<SyncItem[]>('codiatax_sync_queue', []);
    }

    private saveQueue() {
        storage.setItem('codiatax_sync_queue', this.queue);
        this.notifyListeners();
    }

    private notifyListeners() {
        const status: SyncStatus = {
            pending: this.queue.length,
            isSyncing: this.isProcessing,
            lastError: this.lastError,
            lastErrorType: this.lastErrorType
        };
        this.listeners.forEach(l => l(status));
    }

    subscribe(callback: (status: SyncStatus) => void) {
        this.listeners.push(callback);
        callback({
            pending: this.queue.length,
            isSyncing: this.isProcessing,
            lastError: this.lastError,
            lastErrorType: this.lastErrorType
        });
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    addToQueue(item: Omit<SyncItem, 'id' | 'timestamp'>) {
        const newItem = {
            ...item,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now()
        } as SyncItem;

        this.queue.push(newItem);
        this.lastError = null;
        this.lastErrorType = undefined;
        this.saveQueue();

        if (storage.isOnline()) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.isProcessing || !storage.isOnline()) return;
        if (this.queue.length === 0) {
            this.notifyListeners();
            return;
        }

        this.isProcessing = true;
        this.lastError = null;
        this.notifyListeners();

        console.log(`[SyncService] Iniciando procesamiento de ${this.queue.length} tareas...`);

        while (this.queue.length > 0 && storage.isOnline()) {
            const item = this.queue[0];
            try {
                const success = await this.executeOperation(item);
                if (success) {
                    this.queue.shift();
                    this.saveQueue();
                    console.log(`[SyncService] Sincronizado: ${item.entityType} ${item.operation}`);
                } else {
                    this.lastError = `Fallo en operación ${item.entityType}`;
                    this.lastErrorType = 'SERVER';
                    break;
                }
            } catch (error: any) {
                this.handleError(error);
                break;
            }
        }

        this.isProcessing = false;
        this.notifyListeners();
        console.log(`[SyncService] Procesamiento finalizado. Pendientes: ${this.queue.length}`);
    }

    private handleError(error: any) {
        this.lastError = error.message || "Error desconocido";

        // Basic error classification
        if (error.message?.includes('fetch') || error.status === 0) {
            this.lastErrorType = 'NETWORK';
        } else if (error.status >= 400 && error.status < 500) {
            this.lastErrorType = 'VALIDATION';
        } else {
            this.lastErrorType = 'SERVER';
        }

        console.error("[SyncService] Error:", error);
    }

    private async executeOperation(item: SyncItem): Promise<boolean> {
        try {
            const { ServiceRepository } = await import('./repositories/ServiceRepository');
            const { ExpenseRepository } = await import('./repositories/ExpenseRepository');
            const { SubscriberRepository } = await import('./repositories/SubscriberRepository');
            const { VehicleRepository } = await import('./repositories/VehicleRepository');
            const { ShiftRepository } = await import('./repositories/ShiftRepository');

            switch (item.entityType) {
                case 'SERVICE':
                    if (item.operation === 'CREATE') await ServiceRepository.create(item.data, item.userName);
                    else if (item.operation === 'UPDATE') await ServiceRepository.update(item.entityId, item.data, item.userName);
                    else if (item.operation === 'DELETE') await ServiceRepository.delete(item.entityId);
                    break;
                case 'EXPENSE':
                    if (item.operation === 'CREATE') await ExpenseRepository.create(item.data, item.userName);
                    else if (item.operation === 'UPDATE') await ExpenseRepository.update(item.entityId, item.data);
                    else if (item.operation === 'DELETE') await ExpenseRepository.delete(item.entityId);
                    break;
                case 'SUBSCRIBER':
                    if (item.operation === 'CREATE') await SubscriberRepository.create(item.data, item.userName);
                    else if (item.operation === 'UPDATE') await SubscriberRepository.update(item.entityId, item.data);
                    else if (item.operation === 'DELETE') await SubscriberRepository.delete(item.entityId);
                    break;
                case 'VEHICLE':
                    if (item.operation === 'UPSERT') await VehicleRepository.upsert(item.data, item.userName);
                    break;
                case 'SHIFT':
                    if (item.operation === 'UPSERT') await ShiftRepository.upsert(item.data, item.userName);
                    break;
            }
            return true;
        } catch (e) {
            console.warn(`Failed to sync ${item.entityType} ${item.operation}:`, e);
            throw e; // Propagate to processQueue for common handling
        }
    }

    getQueueStatus() {
        return {
            pending: this.queue.length,
            isSyncing: this.isProcessing
        };
    }
}

export const syncService = new SyncService();
