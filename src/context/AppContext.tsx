import React, { createContext, useContext, ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { UIProvider, useUI } from './UIContext';
import { VehicleProvider, useVehicle } from './VehicleContext';
import { ServiceProvider, useServices } from './ServiceContext';
import { ShiftProvider, useShifts } from './ShiftContext';
import { DataRepository } from '../services/repositories/DataRepository';
import { createDefaultUser } from '../utils/userHelpers';
import { PersistenceService } from '../services/PersistenceService';

// Re-export types if needed, or import them
import {
  Service, Expense, Subscriber, ShiftStorage, VehicleData, MileageLog,
  MaintenanceItem, ShiftType, AnnualConfig, UserShiftConfig,
  BackupData, AirportShift, User
} from '../types/index';

// Define the COMPLETE monolithic interface
// Domain-specific state interfaces
export interface AppUIState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  toast: { message: string, type: 'success' | 'error' | 'warning' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export interface AppAuthState {
  user: User | null;
  login: (name: string, licenseNumber: string, pin: string) => void;
  logout: () => void;
  setAppPin: (pin: string) => void;
  verifyPin: (pin: string) => boolean;
}

export interface AppVehicleState {
  vehicle: VehicleData;
  setVehicle: React.Dispatch<React.SetStateAction<VehicleData>>;
  currentOdometer: number;
  setInitialOdometer: (km: number) => void;
  mileageLogs: MileageLog[];
  addMileageLog: (log: Omit<MileageLog, 'id'>) => void;
  updateMaintenance: (key: string, lastKm: number) => void;
  addMaintenanceItem: (key: string, item: MaintenanceItem) => void;
}

export interface AppServiceState {
  services: Service[];
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: number, updates: Partial<Service>) => Promise<void>;
  deleteService: (id: number) => Promise<void>;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: number, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  subscribers: Subscriber[];
  addSubscriber: (subscriber: Omit<Subscriber, 'id' | 'createdAt'>) => Promise<void>;
  updateSubscriber: (id: string, updates: Partial<Subscriber>) => Promise<void>;
  deleteSubscriber: (id: string) => Promise<void>;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  forceManualSync: () => Promise<void>;
  lastSyncError?: string;
  annualConfig: AnnualConfig;
  updateAnnualConfig: (config: Partial<AnnualConfig>) => void;
}

export interface AppShiftState {
  shiftStorage: ShiftStorage;
  toggleAirportShift: (dateStr: string, type?: string, userName?: string | null) => { success: boolean, action?: string, type?: string, error?: string };
  toggleRestDay: (dateStr: string) => void;
  checkShiftCollision: (week: string, type: ShiftType, currentUserName: string) => string | null;
  saveUserShiftConfig: (config: UserShiftConfig) => void;
  getShiftForDate: (date: Date) => any;
  generateAirportCycle: (startDateStr: string, type?: string) => { success: boolean, count?: number, error?: string };
  clearFutureAirportShifts: (fromDateStr: string) => { success: boolean, error?: string };
  undoLastAction: () => { success: boolean };
  undoBuffer: AirportShift[] | null;
}

// Composition of the global context type
export interface AppContextType extends AppUIState, AppAuthState, AppVehicleState, AppServiceState, AppShiftState {
  resetAppData: () => Promise<PersistenceResult>;
  restoreAppData: (backup: BackupData) => Promise<PersistenceResult>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AppBridge: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const ui = useUI();
  const vehicle = useVehicle();
  const services = useServices();
  const shifts = useShifts();

  const resetAppData = async () => {
    return await PersistenceService.resetAppData(auth.user?.name);
  };

  const restoreAppData = async (backup: BackupData) => {
    return await PersistenceService.restoreAppData(backup);
  };

  const loginAdapter = (name: string, licenseNumber: string, _pin: string) => {
    const user = createDefaultUser(name, licenseNumber);
    auth.login(user, true);
  };

  // Sync Queue State Monitoring
  const [syncQueueStatus, setSyncQueueStatus] = React.useState<{ pending: number; isSyncing: boolean; lastError: string | null }>({
    pending: 0,
    isSyncing: false,
    lastError: null
  });

  React.useEffect(() => {
    let unsubscribe: () => void;
    import('../services/SyncService').then(({ syncService }) => {
      unsubscribe = syncService.subscribe((status) => {
        setSyncQueueStatus(status);
      });
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const getDerivedSyncStatus = () => {
    if (syncQueueStatus.isSyncing) return 'syncing';
    if (syncQueueStatus.lastError) return 'error';
    if (syncQueueStatus.pending > 0) return 'idle'; // It's idle but has pending items (Inactivo/Pendiente)
    return services.syncStatus;
  };

  const contextValue: AppContextType = {
    ...ui,
    ...auth,
    login: loginAdapter,
    ...vehicle,
    ...services,
    syncStatus: getDerivedSyncStatus(),
    updateMaintenance: vehicle.updateMaintenance,
    addMaintenanceItem: vehicle.addMaintenanceItem,
    ...shifts,
    undoBuffer: null,
    resetAppData,
    restoreAppData,
    lastSyncError: syncQueueStatus.lastError || undefined
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <AuthProvider>
        <VehicleProvider>
          <ServiceProvider>
            <ShiftProvider>
              <AppBridge>{children}</AppBridge>
            </ShiftProvider>
          </ServiceProvider>
        </VehicleProvider>
      </AuthProvider>
    </UIProvider>
  );
};

/**
 * @deprecated
 * Este hook agrega TODOS los dominios de la app en un único contexto global.
 * Evita usarlo en código nuevo y prefiere los hooks de dominio:
 * `useAuth`, `useUI`, `useVehicle`, `useServices` y `useShifts`.
 * Se mantiene solo por compatibilidad con código existente.
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
