export type UserRole = 'propietario' | 'asalariado';
export type WorkMode = 'solo' | 'fixed' | 'rotating';
export type ShiftType = 'mañana' | 'tarde' | 'libre';
export type Money = number;
export type Km = number;

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
    lastKm: Km;
    interval: Km;
}

export interface Vehicle {
    licensePlate: string;
    model: string;
    initialOdometer: Km;
    maintenance: {
        oil: MaintenanceItem;
        tires: MaintenanceItem;
        brakes: MaintenanceItem;
        [key: string]: MaintenanceItem;
    };
}

export interface Subscriber {
    id: string;
    name: string;
    isCapped: boolean;
    capAmount: Money;
    officeNumber?: string;
    createdAt: string;
}

export interface Service {
    id: number;
    timestamp: string;
    amount: Money; // This should be the final amount to be paid/recorded
    originalAmount?: Money; // Optional: what was on the meter
    type: 'normal' | 'company' | 'facturado';
    companyName?: string;
    subscriberId?: string; // Link to the new Subscriber model
    isPaid?: boolean; // For subscriber services that take 2-3 months to collect
    observation?: string;
    source?: 'manual' | 'total';
}

export interface Expense {
    id: number;
    timestamp: string;
    amount: Money;
    category: string;
    description: string;
    type?: string;
}

export interface MaintenanceRecord {
    id: number;
    type: string;
    label: string;
    currentKm: Km;
    nextKm: Km | string;
    date: string;
    notes: string;
}

export interface AirportShift {
    date: string;
    userId: string;
    type: string;
}

export interface AnnualConfig {
    yearStartKm: Km;
    yearEndKm: Km;
    manualGrossIncome: Money;
}

export interface UserShiftConfig {
    userName: string;
    shiftWeek: string;
    shiftType: ShiftType;
    startTime: string;
    endTime: string;
}

export interface ShiftStorage {
    assignments: AirportShift[];
    restDays: string[];
    userConfigs: UserShiftConfig[];
}

export type Period = 'day' | 'week' | 'month' | 'year';

export interface BackupData {
    services?: Service[];
    expenses?: Expense[];
    vehicle?: Vehicle;
    subscribers?: Subscriber[];
    shiftStorage?: ShiftStorage;
    mileageLogs?: MileageLog[];
    annualConfig?: AnnualConfig;
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

export interface MileageLog {
    id: number;
    timestamp: string; // Updated from date to timestamp for consistent date parsing
    amount: Km;
    notes?: string;
}

export type VehicleData = Vehicle; export interface DriverProfile {
    userId: string;
    fullName: string;
    dni?: string;
    nif: string;
    address: string;
    licenseNo: string;
    municipality: string;
    phone?: string;
    email?: string;
    regime: string;
}

export interface Invoice {
    id: string;
    userId: string;
    number: string;
    series: string;
    dateEmission: string;
    dateService: string;
    origin: string;
    destination: string;
    timeStart?: string;
    timeEnd?: string;
    km?: number;
    baseAmount: number;
    ivaRate: number;
    ivaAmount: number;
    totalAmount: number;
    paymentMethod: 'Efectivo' | 'Tarjeta' | 'Bizum' | 'Transferencia';
    clientName: string;
    clientNif?: string;
    clientAddress?: string;
    clientEmail?: string;
    createdAt: string;
}
