import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { format, addDays, parseISO, isValid } from '../utils/dateHelpers';
import { calculateAirportCycle, filterFutureAssignments } from '../utils/airportLogic';
import {
  User, Vehicle, Service, Expense, ShiftStorage,
  MaintenanceItem, AirportShift, ShiftType, WorkMode
} from '../types';
import { supabase } from '../supabase';

interface AppContextType {
  user: User | null;
  login: (userData: User, rememberMe: boolean) => void;
  logout: () => void;
  vehicle: Vehicle;
  setVehicle: React.Dispatch<React.SetStateAction<Vehicle>>;
  currentOdometer: number;
  setInitialOdometer: (km: string | number) => void;
  mileageLogs: any[];
  addMileageLog: (log: any) => void;
  updateMaintenance: (key: string, lastKm: number) => void;
  addMaintenanceItem: (key: string, data: MaintenanceItem) => void;
  services: Service[];
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: number, updates: Partial<Service>) => void;
  deleteService: (id: number) => void;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: number, updates: Partial<Expense>) => void;
  deleteExpense: (id: number) => void;
  setAppPin: (pin: string) => void;
  verifyPin: (pin: string) => boolean;
  toast: { message: string, type: string } | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  annualConfig: any;
  updateAnnualConfig: (newConfig: any) => void;
  shiftStorage: ShiftStorage;
  toggleAirportShift: (dateStr: string, type?: string, userName?: string | null) => { success: boolean, action?: string, type?: string, error?: string };
  toggleRestDay: (dateStr: string) => void;
  checkShiftCollision: (week: string, type: ShiftType, currentUserName: string) => string | null;
  saveUserShiftConfig: (config: any) => void;
  getShiftForDate: (date: Date) => any;
  generateAirportCycle: (startDateStr: string, type?: string) => { success: boolean, count?: number, error?: string };
  clearFutureAirportShifts: (fromDateStr: string) => { success: boolean, error?: string };
  undoLastAction: () => { success: boolean };
  undoBuffer: AirportShift[] | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- State ---
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('codiatax_user');
    return saved && saved !== "undefined" ? JSON.parse(saved) : null;
  });

  const [vehicle, setVehicle] = useState<Vehicle>(() => {
    const defaultVehicle: Vehicle = {
      licensePlate: '',
      model: '',
      initialOdometer: 0,
      maintenance: {
        oil: { name: 'Aceite', lastKm: 0, interval: 15000 },
        tires: { name: 'Neumáticos', lastKm: 0, interval: 40000 },
        brakes: { name: 'Frenos', lastKm: 0, interval: 30000 }
      }
    };

    try {
      const saved = localStorage.getItem('codiatax_vehicle');
      const parsed = saved ? JSON.parse(saved) : null;

      if (parsed && typeof parsed === 'object' && parsed.maintenance) {
        return parsed as Vehicle;
      }

      console.warn('Vehicle data invalid, using defaults');
      return defaultVehicle;
    } catch (e) {
      console.error('Error parsing vehicle data', e);
      return defaultVehicle;
    }
  });

  const [mileageLogs, setMileageLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('codiatax_mileage');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing mileage logs', e);
      return [];
    }
  });

  const [services, setServices] = useState<Service[]>(() => {
    try {
      const saved = localStorage.getItem('codiatax_services');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? (parsed as Service[]) : [];
    } catch (e) {
      console.error('Error parsing services', e);
      return [];
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('codiatax_expenses');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? (parsed as Expense[]) : [];
    } catch (e) {
      console.error('Error parsing expenses', e);
      return [];
    }
  });

  const [annualConfig, setAnnualConfig] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('codiatax_annual_config');
      const parsed = saved ? JSON.parse(saved) : null;

      if (parsed && typeof parsed === 'object') {
        return { yearStartKm: 0, yearEndKm: 0, manualGrossIncome: 0, ...parsed };
      }

      return { yearStartKm: 0, yearEndKm: 0, manualGrossIncome: 0 };
    } catch (e) {
      console.error('Error parsing annual config', e);
      return { yearStartKm: 0, yearEndKm: 0, manualGrossIncome: 0 };
    }
  });

  const [shiftStorage, setShiftStorage] = useState<ShiftStorage>(() => {
    const defaultShiftStorage: ShiftStorage = { assignments: [], restDays: [], userConfigs: [] };
    try {
      const saved = localStorage.getItem('codiatax_shift_storage');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && Array.isArray(parsed.assignments) && Array.isArray(parsed.restDays)) {
        return parsed as ShiftStorage;
      }
      console.warn("Shift storage corrupted or invalid format, resetting to default.");
      return defaultShiftStorage;
    } catch (e) {
      console.error("Error parsing shift storage", e);
      return defaultShiftStorage;
    }
  });

  const [toast, setToast] = useState<{ message: string, type: string } | null>(null);

  // --- Persistence with Debouncing ---
  const useLocalStorage = (key: string, state: any) => {
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        if (state !== null && state !== undefined) {
          localStorage.setItem(key, JSON.stringify(state));

          // Trigger Cloud Sync if user is logged in
          if (user) {
            triggerCloudSync(key, state);
          }
        }
      }, 1000); // Increased debounce for cloud sync

      return () => clearTimeout(timeoutId);
    }, [key, state]);
  };

  const triggerCloudSync = async (key: string, data: any) => {
    if (!user) return;

    try {
      const uid = user.name;
      switch (key) {
        case 'codiatax_services':
          await supabase.from('servicios').upsert(data.map((s: any) => ({ ...s, user_id: uid })));
          break;
        case 'codiatax_expenses':
          await supabase.from('gastos').upsert(data.map((e: any) => ({ ...e, user_id: uid })));
          break;
        case 'codiatax_vehicle':
          await supabase.from('vehiculos').upsert({
            license_plate: data.licensePlate,
            model: data.model,
            initial_odometer: data.initialOdometer,
            maintenance_data: data.maintenance,
            user_id: uid
          });
          break;
        case 'codiatax_shift_storage':
          await supabase.from('turnos_storage').upsert({
            user_id: uid,
            data_json: data,
            updated_at: new Date().toISOString()
          });
          break;
      }
    } catch (err) {
      console.warn('Sync failed (offline?):', err);
    }
  };

  // --- Initial Cloud Pull ---
  useEffect(() => {
    if (!user) return;

    const pullData = async () => {
      try {
        const uid = user.name;

        // Parallel fetch
        const [
          { data: sData },
          { data: eData },
          { data: vData },
          { data: tData }
        ] = await Promise.all([
          supabase.from('servicios').select('*').eq('user_id', uid),
          supabase.from('gastos').select('*').eq('user_id', uid),
          supabase.from('vehiculos').select('*').eq('user_id', uid).maybeSingle(),
          supabase.from('turnos_storage').select('*').eq('user_id', uid).maybeSingle()
        ]);

        // Simple merge: If cloud exists and local is empty/different, prioritize cloud for this session
        // or just merge unique IDs
        if (sData && sData.length > 0) {
          setServices(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = sData.filter(s => !existingIds.has(s.id));
            return [...prev, ...newOnes].sort((a, b) => b.id - a.id);
          });
        }

        if (eData && eData.length > 0) {
          setExpenses(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = eData.filter(e => !existingIds.has(e.id));
            return [...prev, ...newOnes].sort((a, b) => b.id - a.id);
          });
        }

        if (vData && !vehicle.licensePlate) {
          setVehicle({
            licensePlate: vData.license_plate,
            model: vData.model,
            initialOdometer: vData.initial_odometer,
            maintenance: vData.maintenance_data
          });
        }

        if (tData && shiftStorage.assignments.length === 0) {
          setShiftStorage(tData.data_json);
        }
      } catch (err) {
        console.error('Initial pull failed:', err);
      }
    };

    pullData();
  }, [user]);

  // Undo Buffer
  const [undoBuffer, setUndoBuffer] = useState<AirportShift[] | null>(null);

  // User persistence (immediate for login/logout)
  useEffect(() => {
    if (user) {
      localStorage.setItem('codiatax_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('codiatax_user');
    }
  }, [user]);

  useLocalStorage('codiatax_vehicle', vehicle);
  useLocalStorage('codiatax_mileage', mileageLogs);
  useLocalStorage('codiatax_services', services);
  useLocalStorage('codiatax_expenses', expenses);
  useLocalStorage('codiatax_annual_config', annualConfig);
  useLocalStorage('codiatax_shift_storage', shiftStorage);

  // --- Actions ---
  const login = (userData: User, rememberMe: boolean) => {
    setUser(userData);
    if (rememberMe) {
      localStorage.setItem('codiatax_user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('codiatax_user');
  };

  const checkShiftCollision = (week: string, type: ShiftType, currentUserName: string): string | null => {
    const configs = shiftStorage.userConfigs || [];
    const collision = configs.find(c => c.shiftWeek === week && c.shiftType === type && c.userName !== currentUserName);
    return collision ? collision.userName : null;
  };

  const saveUserShiftConfig = (config: any) => {
    setShiftStorage(prev => {
      const otherConfigs = (prev.userConfigs || []).filter(c => c.userName !== config.userName);
      return {
        ...prev,
        userConfigs: [...otherConfigs, config]
      } as ShiftStorage;
    });
  };

  const addMileageLog = (log: any) => {
    setMileageLogs(prev => [...prev, { ...log, id: Date.now() }]);
  };

  const updateMaintenance = (key: string, lastKm: number) => {
    setVehicle(prev => ({
      ...prev,
      maintenance: {
        ...prev.maintenance,
        [key]: { ...prev.maintenance[key], lastKm }
      }
    }));
  };

  const addMaintenanceItem = (key: string, data: MaintenanceItem) => {
    setVehicle(prev => ({
      ...prev,
      maintenance: {
        ...prev.maintenance,
        [key]: data
      }
    }));
  };

  const addService = (service: Omit<Service, 'id'>) => {
    setServices(prev => [{ ...service, id: Date.now() } as Service, ...prev]);
  };

  const updateService = (id: number, updates: Partial<Service>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteService = (id: number) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [{ ...expense, id: Date.now() } as Expense, ...prev]);
  };

  const updateExpense = (id: number, updates: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteExpense = (id: number) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const setAppPin = (pin: string) => {
    localStorage.setItem('codiatax_app_pin', pin);
  };

  const verifyPin = (pin: string): boolean => {
    const saved = localStorage.getItem('codiatax_app_pin');
    return saved === pin;
  };

  const setInitialOdometer = (km: string | number) => {
    setVehicle(prev => ({ ...prev, initialOdometer: parseInt(km.toString()) }));
  };

  const updateAnnualConfig = (newConfig: any) => {
    setAnnualConfig((prev: any) => ({ ...prev, ...newConfig }));
  };

  const toggleRestDay = (dateStr: string) => {
    setShiftStorage(prev => {
      const isRest = prev.restDays?.includes(dateStr);
      const updated = {
        ...prev,
        restDays: isRest
          ? (prev.restDays || []).filter(d => d !== dateStr)
          : [...(prev.restDays || []), dateStr]
      };
      return updated as ShiftStorage;
    });
  };

  const generateAirportCycle = (startDateStr: string, type: string = 'standard') => {
    if (!user) return { success: false, error: 'User required' };
    setUndoBuffer(shiftStorage.assignments);

    const assignments = filterFutureAssignments(shiftStorage.assignments || [], user.name, startDateStr);
    const newAssignments = calculateAirportCycle(startDateStr, user.name, type);

    if (newAssignments.length === 0) return { success: false, error: 'Invalid start date' };

    setShiftStorage(prev => ({
      ...prev,
      assignments: [...assignments, ...newAssignments]
    } as ShiftStorage));

    return { success: true, count: newAssignments.length };
  };

  const clearFutureAirportShifts = (fromDateStr: string) => {
    if (!user) return { success: false, error: 'User required' };
    setUndoBuffer(shiftStorage.assignments);

    setShiftStorage(prev => ({
      ...prev,
      assignments: filterFutureAssignments(prev.assignments || [], user.name, fromDateStr)
    } as ShiftStorage));
    return { success: true };
  };

  const undoLastAction = () => {
    if (undoBuffer) {
      setShiftStorage(prev => ({ ...prev, assignments: undoBuffer } as ShiftStorage));
      setUndoBuffer(null);
      return { success: true };
    }
    return { success: false };
  };

  const toggleAirportShift = (dateStr: string, type: string = 'standard', userName: string | null = null) => {
    const targetUser = userName || user?.name;
    if (!targetUser) return { success: false, error: 'User name required' };

    const existing = (shiftStorage.assignments || []).find(a => a.date === dateStr && a.userId === targetUser);
    if (existing) {
      setShiftStorage(prev => ({
        ...prev,
        assignments: (prev.assignments || []).filter(a => !(a.date === dateStr && a.userId === targetUser))
      } as ShiftStorage));
      return { success: true, action: 'removed' };
    } else {
      setShiftStorage(prev => ({
        ...prev,
        assignments: [...(prev.assignments || []), { date: dateStr, userId: targetUser, type }]
      } as ShiftStorage));
      return { success: true, action: 'added', type };
    }
  };

  const currentOdometer = useMemo(() => {
    const baseKm = vehicle.initialOdometer || 0;
    const totalMileage = mileageLogs.reduce((sum, log) => sum + log.amount, 0);
    return baseKm + totalMileage;
  }, [vehicle.initialOdometer, mileageLogs]);

  const getShiftForDate = useCallback((date: Date) => {
    if (!user) return { type: 'libre' as ShiftType, label: 'Servicio Libre' };

    if (user.workMode === 'solo' || (!user.workMode && !user.isShared)) {
      return { type: 'libre' as ShiftType, label: 'Conductor Único', isSolo: true };
    }

    if (user.workMode === 'fixed') {
      const fixedType = user.shiftType || 'mañana';
      return {
        weekLabel: 'Turno Fijo',
        type: fixedType,
        startTime: fixedType === 'mañana' ? '06:00' : '15:00',
        endTime: fixedType === 'mañana' ? '15:00' : '00:00'
      };
    }

    const weekNumStr = format(date, 'I');
    const weekNum = parseInt(weekNumStr);
    const isWeekA = weekNum % 2 !== 0;
    const dateWeekLabel = isWeekA ? 'Semana A' : 'Semana B';

    const isAnchorWeek = user.shiftWeek === dateWeekLabel;
    const currentShiftType = isAnchorWeek ? user.shiftType : (user.shiftType === 'mañana' ? 'tarde' : 'mañana');

    return {
      weekLabel: dateWeekLabel,
      type: currentShiftType,
      startTime: currentShiftType === 'mañana' ? '06:00' : '15:00',
      endTime: currentShiftType === 'mañana' ? '15:00' : '00:00'
    };
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AppContext.Provider value={{
      user, login, logout,
      vehicle, setVehicle,
      currentOdometer, setInitialOdometer,
      mileageLogs, addMileageLog,
      updateMaintenance, addMaintenanceItem,
      services, addService, updateService, deleteService,
      expenses, addExpense, updateExpense, deleteExpense,
      setAppPin, verifyPin,
      toast, showToast,
      annualConfig, updateAnnualConfig,
      shiftStorage, toggleAirportShift, toggleRestDay,
      checkShiftCollision, saveUserShiftConfig,
      getShiftForDate,
      generateAirportCycle, clearFutureAirportShifts, undoLastAction, undoBuffer
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
