import React, { createContext, useContext, ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { UIProvider, useUI } from './UIContext';
import { VehicleProvider, useVehicle } from './VehicleContext';
import { ServiceProvider, useServices } from './ServiceContext';
import { ShiftProvider, useShifts } from './ShiftContext';
import { DataRepository } from '../services/repositories/DataRepository';

// Re-export types if needed, or import them
import {
  Service, Expense, Subscriber, ShiftStorage, VehicleData, MileageLog,
  MaintenanceItem, ShiftType, AnnualConfig, UserShiftConfig,
  BackupData, AirportShift, User
} from '../types/index';

// Define the COMPLETE monolithic interface
interface AppContextType {
  // UI
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  toast: { message: string, type: 'success' | 'error' | 'warning' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;

  // Auth
  user: User | null;
  login: (name: string, licenseNumber: string, pin: string) => void;
  logout: () => void;
  setAppPin: (pin: string) => void;
  verifyPin: (pin: string) => boolean;

  // Vehicle
  vehicle: VehicleData;
  setVehicle: React.Dispatch<React.SetStateAction<VehicleData>>;
  currentOdometer: number;
  setInitialOdometer: (km: number) => void;
  mileageLogs: MileageLog[];
  addMileageLog: (log: Omit<MileageLog, 'id'>) => void;
  updateMaintenance: (key: string, lastKm: number) => void;
  addMaintenanceItem: (key: string, item: MaintenanceItem) => void;

  // Services
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

  // Shifts
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

  // Global
  resetAppData: () => void;
  restoreAppData: (backup: BackupData) => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AppBridge: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const ui = useUI();
  const vehicle = useVehicle();
  const services = useServices();
  const shifts = useShifts();

  const resetAppData = async () => {
    if (window.confirm('¿Seguro que quieres borrar TODO?')) {
      localStorage.clear();
      if (auth.user) {
        try {
          await DataRepository.resetAllData(auth.user.name);
        } catch (e) {
          console.error('Reset failed', e);
        }
      }
      window.location.reload();
    }
  };

  const restoreAppData = async (backup: BackupData) => {
    try {
      if (backup.services) localStorage.setItem('codiatax_services', JSON.stringify(backup.services));
      if (backup.expenses) localStorage.setItem('codiatax_expenses', JSON.stringify(backup.expenses));
      if (backup.vehicle) localStorage.setItem('codiatax_vehicle', JSON.stringify(backup.vehicle));

      setTimeout(() => window.location.reload(), 500);
      return { success: true };
    } catch (e) {
      ui.showToast('Error al restaurar copia', 'error');
      return { success: false, error: 'Error al restaurar copia' };
    }
  };

  const loginAdapter = (name: string, licenseNumber: string, pin: string) => {
    const mockUser: User = {
      name,
      licenseNumber,
      role: 'propietario',
      isShared: false,
      workMode: 'solo',
      shiftWeek: 'Semana A',
      shiftType: 'mañana',
      startTime: '06:00',
      endTime: '15:00',
      lastLogin: new Date().toISOString()
    };
    auth.login(mockUser, true);
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

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
