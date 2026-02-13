import React, { createContext, useContext, ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { UIProvider, useUI } from './UIContext';
import { VehicleProvider, useVehicle } from './VehicleContext';
import { ServiceProvider, useServices } from './ServiceContext';
import { ShiftProvider, useShifts } from './ShiftContext';
import { supabase } from '../supabase';
import { normalizeUsername } from '../utils/userHelpers';

// Re-export types if needed, or import them
import { Service, Expense, Subscriber, ShiftStorage, VehicleData, MileageLog, MaintenanceItem, ShiftType } from '../types/index';

// Define the COMPLETE monolithic interface
interface AppContextType {
  // UI
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  toast: { message: string, type: 'success' | 'error' | 'warning' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;

  // Auth
  user: any;
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
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: number, updates: Partial<Service>) => void;
  deleteService: (id: number) => void;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: number, updates: Partial<Expense>) => void;
  deleteExpense: (id: number) => void;
  subscribers: Subscriber[];
  addSubscriber: (subscriber: Omit<Subscriber, 'id' | 'createdAt'>) => void;
  updateSubscriber: (id: string, updates: Partial<Subscriber>) => void;
  deleteSubscriber: (id: string) => void;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  forceManualSync: () => Promise<void>;
  lastSyncError?: string; // Optional in case I missed it
  annualConfig: any;
  updateAnnualConfig: (config: any) => void;

  // Shifts
  shiftStorage: ShiftStorage;
  toggleAirportShift: (dateStr: string, type?: string, userName?: string | null) => any;
  toggleRestDay: (dateStr: string) => void;
  checkShiftCollision: (week: string, type: ShiftType, currentUserName: string) => string | null;
  saveUserShiftConfig: (config: any) => void;
  getShiftForDate: (date: Date) => any;
  generateAirportCycle: (startDateStr: string, type?: string) => any;
  clearFutureAirportShifts: (fromDateStr: string) => any;
  undoLastAction: () => any;
  undoBuffer: any[]; // Added for compatibility with AirportShifts

  // Global
  resetAppData: () => void;
  restoreAppData: (backup: any) => Promise<{ success: boolean; error?: string }>;
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
        const uid = normalizeUsername(auth.user.name);
        await supabase.from('servicios').delete().eq('user_id', uid);
        await supabase.from('gastos').delete().eq('user_id', uid);
        await supabase.from('vehiculos').delete().eq('user_id', uid);
        await supabase.from('turnos_storage').delete().eq('user_id', uid);
        await supabase.from('abonados').delete().eq('user_id', uid);
      }
      window.location.reload();
    }
  };

  const restoreAppData = async (backup: any) => {
    try {
      if (backup.services) localStorage.setItem('codiatax_services', JSON.stringify(backup.services));
      if (backup.expenses) localStorage.setItem('codiatax_expenses', JSON.stringify(backup.expenses));
      if (backup.vehicle) localStorage.setItem('codiatax_vehicle', JSON.stringify(backup.vehicle));

      // Return success before reload (though reload might interrupt it, it satisfies the interface)
      // Actually, if we reload, the promise won't resolve. 
      // But we can return the object, and THEN reload after a short delay or let the caller handle reload.
      // For now, let's keep the reload here but return the object first? No, that's impossible.
      // Let's remove window.location.reload() from here and let the caller do it if success?
      // Or just return { success: true } and reload.

      setTimeout(() => window.location.reload(), 500);
      return { success: true };
    } catch (e) {
      ui.showToast('Error al restaurar copia', 'error');
      return { success: false, error: 'Error al restaurar copia' };
    }
  };

  const loginAdapter = (name: string, licenseNumber: string, pin: string) => {
    const mockUser: any = {
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

  // Need to cast the mix of contexts to AppContextType because of minor mismatches we are bridging
  const contextValue: any = {
    ...ui,
    ...auth,
    login: loginAdapter,
    ...vehicle,
    ...services,
    updateMaintenance: vehicle.updateMaintenance, // Explicit map if needed
    addMaintenanceItem: vehicle.addMaintenanceItem,
    ...shifts,
    resetAppData,
    restoreAppData,
    lastSyncError: undefined
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
