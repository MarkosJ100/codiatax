import { Service, Expense, Subscriber, VehicleData, ShiftStorage } from './index';

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'UPSERT';
export type SyncEntity = 'SERVICE' | 'EXPENSE' | 'SUBSCRIBER' | 'VEHICLE' | 'SHIFT';

export type SyncItem =
    | { id: string; timestamp: number; userName: string; entityType: 'SERVICE'; operation: 'CREATE'; entityId: number; data: Omit<Service, 'id'> }
    | { id: string; timestamp: number; userName: string; entityType: 'SERVICE'; operation: 'UPDATE'; entityId: number; data: Partial<Service> }
    | { id: string; timestamp: number; userName: string; entityType: 'SERVICE'; operation: 'DELETE'; entityId: number; data: null }
    | { id: string; timestamp: number; userName: string; entityType: 'EXPENSE'; operation: 'CREATE'; entityId: number; data: Omit<Expense, 'id'> }
    | { id: string; timestamp: number; userName: string; entityType: 'EXPENSE'; operation: 'UPDATE'; entityId: number; data: Partial<Expense> }
    | { id: string; timestamp: number; userName: string; entityType: 'EXPENSE'; operation: 'DELETE'; entityId: number; data: null }
    | { id: string; timestamp: number; userName: string; entityType: 'SUBSCRIBER'; operation: 'CREATE'; entityId: string; data: Omit<Subscriber, 'id' | 'createdAt'> }
    | { id: string; timestamp: number; userName: string; entityType: 'SUBSCRIBER'; operation: 'UPDATE'; entityId: string; data: Partial<Subscriber> }
    | { id: string; timestamp: number; userName: string; entityType: 'SUBSCRIBER'; operation: 'DELETE'; entityId: string; data: null }
    | { id: string; timestamp: number; userName: string; entityType: 'VEHICLE'; operation: 'UPSERT'; entityId: string; data: VehicleData }
    | { id: string; timestamp: number; userName: string; entityType: 'SHIFT'; operation: 'UPSERT'; entityId: string; data: ShiftStorage };

export interface SyncStatus {
    pending: number;
    isSyncing: boolean;
    lastError: string | null;
    lastErrorType?: 'NETWORK' | 'SERVER' | 'VALIDATION' | 'UNKNOWN';
}
