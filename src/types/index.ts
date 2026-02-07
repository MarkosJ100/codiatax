export type UserRole = 'owner' | 'employee';
export type WorkMode = 'solo' | 'fixed' | 'rotating';
export type ShiftType = 'mañana' | 'tarde' | 'libre';

export interface User {
    name: string;
    role: UserRole;
    licenseNumber: string;
    isShared: boolean;
    workMode: WorkMode;
    shiftWeek: string;
    shiftType: ShiftType;
    startTime: string;
    endTime: string;
    lastLogin: string;
}

export interface MaintenanceItem {
    name: string;
    lastKm: number;
    interval: number;
}

export interface Vehicle {
    licensePlate: string;
    model: string;
    initialOdometer: number;
    maintenance: {
        oil: MaintenanceItem;
        tires: MaintenanceItem;
        brakes: MaintenanceItem;
        [key: string]: MaintenanceItem;
    };
}

export interface Service {
    id: number;
    timestamp: string;
    amount: number;
    type: 'normal' | 'company' | 'facturado';
    companyName?: string;
    observation?: string;
    source?: 'manual' | 'total';
}

export interface Expense {
    id: number;
    timestamp: string;
    amount: number;
    category: string;
    description: string;
    type?: string;
}

export interface MaintenanceRecord {
    id: number;
    type: string;
    label: string;
    currentKm: number;
    nextKm: number | string;
    date: string;
    notes: string;
}

export interface AirportShift {
    date: string;
    userId: string;
    type: string;
}

export interface ShiftStorage {
    assignments: AirportShift[];
    restDays: string[];
    userConfigs: any[];
}

export interface Toast {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

export interface ShiftInfo {
    type: ShiftType;
    weekLabel: string;
}
