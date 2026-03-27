import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef, useMemo } from 'react';
import { Service, Expense, Subscriber, AnnualConfig } from '../types';
import { useAuth } from './AuthContext';
import { ServiceRepository } from '../services/repositories/ServiceRepository';
import { ExpenseRepository } from '../services/repositories/ExpenseRepository';
import { SubscriberRepository } from '../services/repositories/SubscriberRepository';
import { storage } from '../utils/storage';

let syncServicePromise: Promise<typeof import('../services/SyncService')> | null = null;
const getSyncService = async () => {
    if (!syncServicePromise) {
        syncServicePromise = import('../services/SyncService');
    }
    return (await syncServicePromise).syncService;
};

interface ServiceContextType {
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
    annualConfig: AnnualConfig;
    updateAnnualConfig: (config: Partial<AnnualConfig>) => void;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export const ServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');

    const [services, setServices] = useState<Service[]>(() => {
        return storage.getItem<Service[]>('codiatx_services', []);
    });

    const [expenses, setExpenses] = useState<Expense[]>(() => {
        return storage.getItem<Expense[]>('codiatx_expenses', []);
    });

    const [subscribers, setSubscribers] = useState<Subscriber[]>(() => {
        return storage.getItem<Subscriber[]>('codiatx_subscribers', []);
    });

    const [annualConfig, setAnnualConfig] = useState<AnnualConfig>(() => {
        return storage.getItem<AnnualConfig>('codiatx_annual_config', { yearStartKm: 0, yearEndKm: 0, manualGrossIncome: 0 });
    });

    useEffect(() => { storage.setItem('codiatx_annual_config', annualConfig); }, [annualConfig]);

    useEffect(() => { storage.setItem('codiatx_services', services); }, [services]);
    useEffect(() => { storage.setItem('codiatx_expenses', expenses); }, [expenses]);
    useEffect(() => { storage.setItem('codiatx_subscribers', subscribers); }, [subscribers]);

    // -- Cloud Sync Logic --
    const isSyncing = useRef(false);

    const fetchCloudData = useCallback(async () => {
        if (!user || isSyncing.current) return;
        isSyncing.current = true;
        try {
            const [cloudServices, cloudExpenses, cloudSubscribers] = await Promise.all([
                ServiceRepository.getAll(user.name),
                ExpenseRepository.getAll(user.name),
                SubscriberRepository.getAll(user.name)
            ]);

            setServices(cloudServices);
            setExpenses(cloudExpenses);
            setSubscribers(cloudSubscribers);

            setSyncStatus('success');
        } catch (e) {
            console.error('Fetch failed', e);
            setSyncStatus('error');
        } finally {
            isSyncing.current = false;
        }
    }, [user]);

    // Initial Fetch
    useEffect(() => {
        if (user) fetchCloudData();
    }, [user, fetchCloudData]);

    // -- Actions --
    const addService = useCallback(async (service: Omit<Service, 'id'>) => {
        const localId = Date.now();
        const localService = { ...service, id: localId };
        setServices(prev => [localService, ...prev]);
        if (user) {
            try {
                if (storage.isOnline()) {
                    const newService = await ServiceRepository.create(service, user.name);
                    setServices(prev => prev.map(s => s.id === localId ? newService : s));
                } else { throw new Error('Offline'); }
            } catch (error) {
                const syncService = await getSyncService();
                syncService.addToQueue({ entityId: localId, entityType: 'SERVICE', operation: 'CREATE', data: service, userName: user.name });
            }
        }
    }, [user]);

    const deleteService = useCallback(async (id: number) => {
        setServices(prev => prev.filter(s => s.id !== id));
        if (user) {
            try {
                if (storage.isOnline()) { await ServiceRepository.delete(id); }
                else { throw new Error('Offline'); }
            } catch (e) {
                const syncService = await getSyncService();
                syncService.addToQueue({ entityId: id, entityType: 'SERVICE', operation: 'DELETE', data: null, userName: user.name });
            }
        }
    }, [user]);

    const updateService = useCallback(async (id: number, updates: Partial<Service>) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        if (user) {
            try {
                if (storage.isOnline()) { await ServiceRepository.update(id, updates, user.name); }
                else { throw new Error('Offline'); }
            } catch (e) {
                const syncService = await getSyncService();
                syncService.addToQueue({ entityId: id, entityType: 'SERVICE', operation: 'UPDATE', data: updates, userName: user.name });
            }
        }
    }, [user]);

    // Data Migration: Normalize airport names in existing records
    useEffect(() => {
        if (!user || services.length === 0) return;
        
        const toFix = services.filter(s => s.observation && /Jerez de la Frontera Carretera N-IV km\. 628\.5/i.test(s.observation));
        if (toFix.length > 0) {
            toFix.forEach(s => {
                updateService(s.id, { 
                    observation: s.observation!.replace(/Jerez de la Frontera Carretera N-IV km\. 628\.5/gi, 'AEROPUERTO DE JEREZ') 
                });
            });
        }
    }, [services, user, updateService]);

    const addExpense = useCallback(async (expense: Omit<Expense, 'id'>) => {
        const localId = Date.now();
        setExpenses(prev => [{ ...expense, id: localId }, ...prev]);
        if (user) {
            try {
                if (storage.isOnline()) {
                    const newExpense = await ExpenseRepository.create(expense, user.name);
                    setExpenses(prev => prev.map(e => e.id === localId ? newExpense : e));
                } else { throw new Error('Offline'); }
            } catch (error) {
                const syncService = await getSyncService();
                syncService.addToQueue({ entityId: localId, entityType: 'EXPENSE', operation: 'CREATE', data: expense, userName: user.name });
            }
        }
    }, [user]);

    const deleteExpense = useCallback(async (id: number) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
        if (user) {
            try {
                if (storage.isOnline()) { await ExpenseRepository.delete(id); }
                else { throw new Error('Offline'); }
            } catch (e) {
                const syncService = await getSyncService();
                syncService.addToQueue({ entityId: id, entityType: 'EXPENSE', operation: 'DELETE', data: null, userName: user.name });
            }
        }
    }, [user]);

    const updateExpense = useCallback(async (id: number, updates: Partial<Expense>) => {
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
        if (user) {
            try {
                if (storage.isOnline()) { await ExpenseRepository.update(id, updates); }
                else { throw new Error('Offline'); }
            } catch (e) {
                const syncService = await getSyncService();
                syncService.addToQueue({ entityId: id, entityType: 'EXPENSE', operation: 'UPDATE', data: updates, userName: user.name });
            }
        }
    }, [user]);

    const addSubscriber = useCallback(async (data: Omit<Subscriber, 'id' | 'createdAt'>) => {
        const localId = Date.now().toString();
        setSubscribers(prev => [...prev, { ...data, id: localId, createdAt: new Date().toISOString() }]);
        if (user) {
            try {
                if (storage.isOnline()) {
                    const newSub = await SubscriberRepository.create(data, user.name);
                    setSubscribers(prev => prev.map(s => s.id === localId ? newSub : s));
                } else { throw new Error('Offline'); }
            } catch (error) {
                const syncService = await getSyncService();
                syncService.addToQueue({ entityId: localId, entityType: 'SUBSCRIBER', operation: 'CREATE', data: data, userName: user.name });
            }
        }
    }, [user]);

    const deleteSubscriber = useCallback(async (id: string) => {
        setSubscribers(prev => prev.filter(s => s.id !== id));
        if (user) {
            try {
                if (storage.isOnline()) { await SubscriberRepository.delete(id); }
                else { throw new Error('Offline'); }
            } catch (e) {
                const syncService = await getSyncService();
                syncService.addToQueue({ entityId: id, entityType: 'SUBSCRIBER', operation: 'DELETE', data: null, userName: user.name });
            }
        }
    }, [user]);

    const updateSubscriber = useCallback(async (id: string, updates: Partial<Subscriber>) => {
        setSubscribers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        if (user) {
            try {
                if (storage.isOnline()) { await SubscriberRepository.update(id, updates); }
                else { throw new Error('Offline'); }
            } catch (e) {
                const syncService = await getSyncService();
                syncService.addToQueue({ entityId: id, entityType: 'SUBSCRIBER', operation: 'UPDATE', data: updates, userName: user.name });
            }
        }
    }, [user]);

    const forceManualSync = useCallback(async () => {
        setSyncStatus('syncing');
        const syncService = await getSyncService();
        await syncService.processQueue();
        await fetchCloudData();
        setSyncStatus('success');
    }, [fetchCloudData]);

    const updateAnnualConfig = useCallback((newConfig: Partial<AnnualConfig>) => {
        setAnnualConfig((prev: AnnualConfig) => ({ ...prev, ...newConfig }));
    }, []);

    const contextValue = useMemo(() => ({
        services, addService, updateService, deleteService,
        expenses, addExpense, updateExpense, deleteExpense,
        subscribers, addSubscriber, updateSubscriber, deleteSubscriber,
        syncStatus, forceManualSync,
        annualConfig, updateAnnualConfig
    }), [
        services, expenses, subscribers, syncStatus, annualConfig,
        addService, updateService, deleteService,
        addExpense, updateExpense, deleteExpense,
        addSubscriber, updateSubscriber, deleteSubscriber,
        forceManualSync, updateAnnualConfig
    ]);

    return (
        <ServiceContext.Provider value={contextValue}>
            {children}
        </ServiceContext.Provider>
    );
};

export const useServices = () => {
    const context = useContext(ServiceContext);
    if (!context) throw new Error('useServices must be used within ServiceProvider');
    return context;
};

