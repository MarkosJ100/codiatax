import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { format, addDays, parseISO, isValid, isSameDay } from '../utils/dateHelpers';
import { calculateAirportCycle, filterFutureAssignments } from '../utils/airportLogic';
import {
  User, Vehicle, Service, Expense, ShiftStorage,
  MaintenanceItem, AirportShift, ShiftType, WorkMode, UserRole
} from '../types';
import { supabase } from '../supabase';
import { Preferences } from '@capacitor/preferences';
import { normalizeUsername } from '../utils/userHelpers';

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
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
  resetAppData: () => void;
  restoreAppData: (backupData: any) => Promise<{ success: boolean; error?: string }>;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  lastSyncError: string | null;
  forceManualSync: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- State ---
  const [user, setUser] = useState<User | null>(null);

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
      if (!Array.isArray(parsed)) return [];

      // Clean up corrupted entries (those without 'amount' property)
      const cleaned = parsed.filter(log => typeof log === 'object' && log !== null && typeof log.amount === 'number');

      // If we cleaned any entries, save the cleaned version
      if (cleaned.length !== parsed.length) {
        localStorage.setItem('codiatax_mileage', JSON.stringify(cleaned));
        console.log(`Cleaned ${parsed.length - cleaned.length} corrupted mileage entries`);
      }

      return cleaned;
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

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('codiatax_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'light';
  });

  const [toast, setToast] = useState<{ message: string, type: string } | null>(null);

  // --- Sync Diagnosis State ---
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const isSyncingFromCloud = useRef(false); // Guard to prevent re-uploading data during cloud pull

  // Persistence for Theme
  useEffect(() => {
    localStorage.setItem('codiatax_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // --- Persistence with Debouncing ---
  const useLocalStorage = (key: string, state: any) => {
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        if (state !== null && state !== undefined) {
          localStorage.setItem(key, JSON.stringify(state));

          // Only sync to cloud if NOT currently pulling from cloud (avoids re-upload loop)
          if (user && !isSyncingFromCloud.current) {
            triggerCloudSync(key, state);
          }
        }
      }, 2000); // 2s debounce to batch changes

      return () => clearTimeout(timeoutId);
    }, [key, state]);
  };

  // --- Supabase Auth Integration ---
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial Session Check:', session?.user?.email, 'Confirmed:', session?.user?.email_confirmed_at);
      if (session?.user) {
        if (session.user.confirmed_at || session.user.email_confirmed_at) {
          const metadata = session.user.user_metadata;
          const rawRole = metadata.role || 'propietario';
          const normalizedRole: UserRole = (rawRole === 'owner' || rawRole === 'propietario') ? 'propietario' : 'asalariado';

          const appUser: User = {
            name: session.user.user_metadata.name || '',
            role: normalizedRole,
            licenseNumber: session.user.user_metadata.licenseNumber || '',
            isShared: metadata.isShared || false,
            workMode: metadata.workMode || 'solo',
            shiftWeek: metadata.shiftWeek || 'Semana A',
            shiftType: metadata.shiftType || 'mañana',
            startTime: metadata.startTime || '06:00',
            endTime: metadata.endTime || '15:00',
            lastLogin: new Date().toISOString()
          };
          // Persist BEFORE setUser so the route loader finds it immediately
          localStorage.setItem('codiatax_user', JSON.stringify(appUser));
          setUser(appUser);
        } else {
          console.log('Unconfirmed session detected on mount, clearing state.');
          setUser(null);
          localStorage.removeItem('codiatax_user');
        }
      } else {
        setUser(null);
        localStorage.removeItem('codiatax_user');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Supabase Auth Event:', event, 'User:', session?.user?.email, 'Confirmed:', session?.user?.email_confirmed_at);

      if (session?.user && (session.user.confirmed_at || session.user.email_confirmed_at)) {
        const metadata = session.user.user_metadata;
        const rawRole = metadata.role || 'asalariado';
        const normalizedRole: UserRole = (rawRole === 'owner' || rawRole === 'propietario') ? 'propietario' : 'asalariado';

        const appUser: User = {
          name: metadata.name || '',
          role: normalizedRole,
          licenseNumber: metadata.licenseNumber || '',
          isShared: metadata.isShared || false,
          workMode: metadata.workMode || 'solo',
          shiftWeek: metadata.shiftWeek || 'Semana A',
          shiftType: metadata.shiftType || 'mañana',
          startTime: metadata.startTime || '06:00',
          endTime: metadata.endTime || '15:00',
          lastLogin: new Date().toISOString()
        };
        // Persist BEFORE setUser so the route loader finds it immediately
        localStorage.setItem('codiatax_user', JSON.stringify(appUser));
        setUser(appUser);
      } else {
        setUser(null);
        // Special case: if we have a session but unconfirmed, remove from storage to prevent bypass
        if (session?.user && !(session.user.confirmed_at || session.user.email_confirmed_at)) {
          console.log('User signed in but not confirmed, cleaning storage.');
          localStorage.removeItem('codiatax_user');
        }

        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('codiatax_user');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const triggerCloudSync = async (key: string, data: any) => {
    if (!user) return;

    try {
      const uid = normalizeUsername(user.name); // Normalize for consistent Supabase queries
      switch (key) {
        case 'codiatax_services':
          await supabase.from('servicios').upsert(data.map((s: any) => ({
            id: s.id,
            timestamp: s.timestamp,
            amount: s.amount,
            type: s.type,
            company_name: s.companyName || null,
            observation: s.observation || null,
            user_id: uid
          })));
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

  // --- Initial Cloud Pull & Manual Sync ---
  const fetchCloudData = useCallback(async () => {
    if (!user) return;

    try {
      const uid = normalizeUsername(user.name); // Normalize for consistent Supabase queries
      console.log('Fetching cloud data for:', uid);

      // Parallel fetch
      const [
        { data: sData, error: sError },
        { data: eData, error: eError },
        { data: vData, error: vError },
        { data: tData, error: tError }
      ] = await Promise.all([
        supabase.from('servicios').select('*').eq('user_id', uid),
        supabase.from('gastos').select('*').eq('user_id', uid),
        supabase.from('vehiculos').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('turnos_storage').select('*').eq('user_id', uid).maybeSingle()
      ]);

      if (sError) throw sError;
      if (eError) throw eError;
      if (vError && vError.code !== 'PGRST116') throw vError;
      if (tError && tError.code !== 'PGRST116') throw tError;

      // Guard: prevent useLocalStorage from re-uploading this data
      isSyncingFromCloud.current = true;

      // Update state with cloud data (Source of Truth)
      // This ensures deletions on the web are reflected in the app.
      if (sData) {
        const mapped = sData.map((s: any) => ({
          id: s.id,
          timestamp: s.timestamp,
          amount: s.amount,
          type: s.type,
          companyName: s.company_name || undefined,
          observation: s.observation || undefined
        }));
        setServices(mapped.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }

      if (eData) {
        setExpenses(eData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }

      if (vData) {
        // vehicle logic remains similar but ensures we take cloud truth
        setVehicle({
          licensePlate: vData.license_plate,
          model: vData.model,
          initialOdometer: vData.initial_odometer,
          maintenance: vData.maintenance_data || {
            oil: { name: 'Aceite', lastKm: 0, interval: 15000 },
            tires: { name: 'Neumáticos', lastKm: 0, interval: 40000 },
            brakes: { name: 'Frenos', lastKm: 0, interval: 30000 }
          }
        });
      }

      if (tData) {
        setShiftStorage(tData.data_json);
      }
      // Release the guard after a short delay so useLocalStorage effects settle
      setTimeout(() => { isSyncingFromCloud.current = false; }, 3000);
    } catch (err: any) {
      isSyncingFromCloud.current = false;
      console.error('Initial pull failed:', err);
      throw err;
    }
  }, [user]);

  // Fetch cloud data only ONCE after login (not on every re-render)
  const hasFetchedCloud = useRef(false);
  useEffect(() => {
    if (user && !hasFetchedCloud.current) {
      hasFetchedCloud.current = true;
      fetchCloudData().catch(e => console.error("Auto fetch failed", e));
    }
    if (!user) {
      hasFetchedCloud.current = false;
    }
  }, [user, fetchCloudData]);

  const forceManualSync = async () => {
    if (!user) {
      showToast('Debes iniciar sesión para sincronizar', 'error');
      return;
    }

    setSyncStatus('syncing');
    setLastSyncError(null);

    try {
      // 1. Push local data
      await Promise.all([
        triggerCloudSync('codiatax_services', services),
        triggerCloudSync('codiatax_expenses', expenses),
        triggerCloudSync('codiatax_vehicle', vehicle),
        triggerCloudSync('codiatax_shift_storage', shiftStorage)
      ]);

      // 2. Pull remote data
      await fetchCloudData();

      setSyncStatus('success');
      showToast('Sincronización completada', 'success');
      setTimeout(() => setSyncStatus('idle'), 3000);

    } catch (error: any) {
      console.error('Manual sync error:', error);
      setSyncStatus('error');
      setLastSyncError(error.message || 'Error de conexión');
      showToast('Error al sincronizar', 'error');
    }
  };

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
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const login = (userData: User, rememberMe: boolean) => {
    // Deprecated: Auth is now handled by Supabase listener
    setUser(userData);
    if (rememberMe) {
      localStorage.setItem('codiatax_user', JSON.stringify(userData));
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('codiatax_user');
    setSyncStatus('idle');
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
    const today = new Date();
    // Handle both number input and object input
    const amount = typeof log === 'number' ? log : log.amount;
    const timestamp = typeof log === 'object' && log.timestamp ? log.timestamp : today.toISOString();

    setMileageLogs(prev => {
      const existingTodayIndex = prev.findIndex(l => isSameDay(new Date(l.timestamp), today));

      if (existingTodayIndex > -1) {
        const updated = [...prev];
        updated[existingTodayIndex] = {
          ...updated[existingTodayIndex],
          amount
        };
        return updated;
      } else {
        const logEntry = { amount, timestamp, id: Date.now() };
        return [...prev, logEntry];
      }
    });
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

  const resetAppData = useCallback(async () => {
    try {
      showToast('Borrando todos los datos...', 'info');

      // 0. Delete ALL Supabase data for this user FIRST
      if (user?.name) {
        try {
          const userId = user.name;
          await Promise.all([
            supabase.from('servicios').delete().eq('user_id', userId),
            supabase.from('gastos').delete().eq('user_id', userId),
            supabase.from('vehiculos').delete().eq('user_id', userId),
            supabase.from('turnos_storage').delete().eq('user_id', userId)
          ]);
          console.log('Supabase data deleted for user:', userId);
        } catch (supaError) {
          console.warn('Error deleting Supabase data:', supaError);
          // Continue with local reset even if Supabase fails
        }
      }

      // 1. Clear ALL storage nuclear-style
      localStorage.clear();
      sessionStorage.clear();

      try {
        await Preferences.clear();
      } catch (e) {
        console.warn('Error clearing preferences:', e);
      }

      // 2. Clear React state immediately
      setVehicle({
        licensePlate: '',
        model: '',
        initialOdometer: 0,
        maintenance: {
          oil: { name: 'Aceite', lastKm: 0, interval: 15000 },
          tires: { name: 'Neumáticos', lastKm: 0, interval: 40000 },
          brakes: { name: 'Frenos', lastKm: 0, interval: 30000 }
        }
      });
      setMileageLogs([]);
      setServices([]);
      setExpenses([]);
      setAnnualConfig({ yearStartKm: 0, yearEndKm: 0, manualGrossIncome: 0 });
      setShiftStorage({ assignments: [], restDays: [], userConfigs: [] });
      setUser(null);

      // 3. Force hard reload to ensure everything stops
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    } catch (error) {
      console.error('Critical reset error:', error);
      localStorage.clear();
      window.location.reload();
    }
  }, [user, showToast]);

  const restoreAppData = useCallback(async (backupData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate backup structure
      if (!backupData || typeof backupData !== 'object') {
        return { success: false, error: 'Archivo de backup inválido' };
      }

      const { services: bServices, expenses: bExpenses, vehicle: bVehicle, mileageLogs: bMileage, annualConfig: bConfig, shiftStorage: bShifts } = backupData;

      // Restore state
      if (bVehicle) setVehicle(bVehicle);
      if (Array.isArray(bServices)) setServices(bServices);
      if (Array.isArray(bExpenses)) setExpenses(bExpenses);
      if (Array.isArray(bMileage)) setMileageLogs(bMileage);
      if (bConfig) setAnnualConfig(bConfig);
      if (bShifts) setShiftStorage(bShifts);

      // Save to localStorage
      if (bVehicle) localStorage.setItem('codiatax_vehicle', JSON.stringify(bVehicle));
      if (Array.isArray(bServices)) localStorage.setItem('codiatax_services', JSON.stringify(bServices));
      if (Array.isArray(bExpenses)) localStorage.setItem('codiatax_expenses', JSON.stringify(bExpenses));
      if (Array.isArray(bMileage)) localStorage.setItem('codiatax_mileage', JSON.stringify(bMileage));
      if (bConfig) localStorage.setItem('codiatax_annual_config', JSON.stringify(bConfig));
      if (bShifts) localStorage.setItem('codiatax_shift_storage', JSON.stringify(bShifts));

      // Sync to Supabase if user is logged in
      if (user?.name) {
        try {
          const userId = user.name;
          await Promise.all([
            bServices ? supabase.from('servicios').upsert(bServices.map((s: any) => ({ ...s, user_id: userId }))) : Promise.resolve(),
            bExpenses ? supabase.from('gastos').upsert(bExpenses.map((e: any) => ({ ...e, user_id: userId }))) : Promise.resolve(),
            bVehicle ? supabase.from('vehiculos').upsert({
              user_id: userId,
              license_plate: bVehicle.licensePlate,
              model: bVehicle.model,
              initial_odometer: bVehicle.initialOdometer,
              maintenance_data: bVehicle.maintenance
            }) : Promise.resolve(),
            bShifts ? supabase.from('turnos_storage').upsert({
              user_id: userId,
              data_json: bShifts
            }) : Promise.resolve()
          ]);
        } catch (supaError) {
          console.warn('Error syncing restored data to Supabase:', supaError);
        }
      }

      showToast('Datos restaurados correctamente', 'success');
      return { success: true };
    } catch (error) {
      console.error('Error restoring backup:', error);
      return { success: false, error: 'Error al restaurar los datos' };
    }
  }, [user, showToast]);


  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
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
      generateAirportCycle, clearFutureAirportShifts, undoLastAction, undoBuffer,
      resetAppData, restoreAppData,
      syncStatus, lastSyncError, forceManualSync
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
