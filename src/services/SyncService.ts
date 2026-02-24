export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'UPSERT';
export type SyncEntity = 'SERVICE' | 'EXPENSE' | 'SUBSCRIBER' | 'VEHICLE' | 'SHIFT';

export interface SyncItem {
    id: string; // Internal queue ID
    entityId: string | number; // ID of the entity in its own table
    entityType: SyncEntity;
    operation: SyncOperation;
    data: any;
    timestamp: number;
    userName: string;
}

class SyncService {
    private queue: SyncItem[] = [];
    private isProcessing = false;
    private lastError: string | null = null;
    private listeners: ((status: { pending: number; isSyncing: boolean; lastError: string | null }) => void)[] = [];

    constructor() {
        this.loadQueue();
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.processQueue());
        }
    }

    private loadQueue() {
        try {
            const saved = localStorage.getItem('codiatax_sync_queue');
            this.queue = saved ? JSON.parse(saved) : [];
        } catch {
            this.queue = [];
        }
    }

    private saveQueue() {
        localStorage.setItem('codiatax_sync_queue', JSON.stringify(this.queue));
        this.notifyListeners();
    }

    private notifyListeners() {
        const status = {
            pending: this.queue.length,
            isSyncing: this.isProcessing,
            lastError: this.lastError
        };
        this.listeners.forEach(l => l(status));
    }

    subscribe(callback: (status: { pending: number; isSyncing: boolean; lastError: string | null }) => void) {
        this.listeners.push(callback);
        callback({ pending: this.queue.length, isSyncing: this.isProcessing, lastError: this.lastError });
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    addToQueue(item: Omit<SyncItem, 'id' | 'timestamp'>) {
        const newItem: SyncItem = {
            ...item,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now()
        };
        this.queue.push(newItem);
        this.lastError = null; // Clear error on new item
        this.saveQueue();

        if (navigator.onLine) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.isProcessing || !navigator.onLine) return;
        if (this.queue.length === 0) {
            this.notifyListeners(); // Refresh status
            return;
        }

        this.isProcessing = true;
        this.lastError = null;
        this.notifyListeners();

        console.log(`[SyncService] Inciando procesamiento de ${this.queue.length} tareas...`);

        // Process sequentially to maintain order (crucial for logic)
        while (this.queue.length > 0 && navigator.onLine) {
            const item = this.queue[0];
            try {
                const success = await this.executeOperation(item);
                if (success) {
                    this.queue.shift();
                    this.saveQueue();
                    console.log(`[SyncService] Sincronizado: ${item.entityType} ${item.operation}`);
                } else {
                    this.lastError = `Fallo en operación ${item.entityType}`;
                    break;
                }
            } catch (error: any) {
                this.lastError = error.message || "Error desconocido";
                console.error("[SyncService] Error crítico:", error);
                break;
            }
        }

        this.isProcessing = false;
        this.notifyListeners();
        console.log(`[SyncService] Procesamiento finalizado. Pendientes: ${this.queue.length}`);
    }

    private async executeOperation(item: SyncItem): Promise<boolean> {
        // We'll dynamic import repositories to avoid circular dependencies if any
        // or use a registry. For now, we'll implement it directly.
        try {
            const { ServiceRepository } = await import('./repositories/ServiceRepository');
            const { ExpenseRepository } = await import('./repositories/ExpenseRepository');
            const { SubscriberRepository } = await import('./repositories/SubscriberRepository');
            const { VehicleRepository } = await import('./repositories/VehicleRepository');
            const { ShiftRepository } = await import('./repositories/ShiftRepository');

            switch (item.entityType) {
                case 'SERVICE':
                    if (item.operation === 'CREATE') await ServiceRepository.create(item.data, item.userName);
                    if (item.operation === 'UPDATE') await ServiceRepository.update(item.entityId as number, item.data, item.userName);
                    if (item.operation === 'DELETE') await ServiceRepository.delete(item.entityId as number);
                    break;
                case 'EXPENSE':
                    if (item.operation === 'CREATE') await ExpenseRepository.create(item.data, item.userName);
                    if (item.operation === 'UPDATE') await ExpenseRepository.update(item.entityId as number, item.data);
                    if (item.operation === 'DELETE') await ExpenseRepository.delete(item.entityId as number);
                    break;
                case 'SUBSCRIBER':
                    if (item.operation === 'CREATE') await SubscriberRepository.create(item.data, item.userName);
                    if (item.operation === 'UPDATE') await SubscriberRepository.update(item.entityId as string, item.data);
                    if (item.operation === 'DELETE') await SubscriberRepository.delete(item.entityId as string);
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
            return false;
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
