import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Service, Expense, Subscriber, AnnualConfig } from '../types';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';
import { ServiceRepository } from '../services/repositories/ServiceRepository';
import { ExpenseRepository } from '../services/repositories/ExpenseRepository';
import { SubscriberRepository } from '../services/repositories/SubscriberRepository';

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
    const { showToast } = useUI();
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');

    // -- Services State --
    const [services, setServices] = useState<Service[]>(() => {
        try {
            const saved = localStorage.getItem('codiatax_services');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    // -- Expenses State --
    const [expenses, setExpenses] = useState<Expense[]>(() => {
        try {
            const saved = localStorage.getItem('codiatax_expenses');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    // -- Subscribers State --
    const [subscribers, setSubscribers] = useState<Subscriber[]>(() => {
        try {
            const saved = localStorage.getItem('codiatax_subscribers');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    // -- Annual Config --
    const [annualConfig, setAnnualConfig] = useState<AnnualConfig>(() => {
        try {
            const saved = localStorage.getItem('codiatax_annual_config');
            return saved ? JSON.parse(saved) : { yearStartKm: 0, yearEndKm: 0, manualGrossIncome: 0 };
        } catch { return { yearStartKm: 0, yearEndKm: 0, manualGrossIncome: 0 }; }
    });

    useEffect(() => { localStorage.setItem('codiatax_annual_config', JSON.stringify(annualConfig)); }, [annualConfig]);

    // -- Persistence --
    useEffect(() => { localStorage.setItem('codiatax_services', JSON.stringify(services)); }, [services]);
    useEffect(() => { localStorage.setItem('codiatax_expenses', JSON.stringify(expenses)); }, [expenses]);
    useEffect(() => { localStorage.setItem('codiatax_subscribers', JSON.stringify(subscribers)); }, [subscribers]);

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
    const addService = async (service: Omit<Service, 'id'>) => {
        const localId = Date.now();
        const localService = { ...service, id: localId };

        // Optimistic update
        setServices(prev => [localService, ...prev]);

        if (user) {
            try {
                if (navigator.onLine) {
                    const newService = await ServiceRepository.create(service, user.name);
                    // Update the local service with the one from the database (real ID)
                    setServices(prev => prev.map(s => s.id === localId ? newService : s));
                    showToast('Servicio sincronizado', 'success');
                } else {
                    throw new Error('Offline');
                }
            } catch (error) {
                import('../services/SyncService').then(({ syncService }) => {
                    syncService.addToQueue({
                        entityId: localId,
                        entityType: 'SERVICE',
                        operation: 'CREATE',
                        data: service,
                        userName: user.name
                    });
                });
                showToast('Guardado local (pendiente de sincronizar)', 'warning');
            }
        } else {
            showToast('Guardado local (sin sesión)', 'warning');
        }
    };

    const deleteService = async (id: number) => {
        setServices(prev => prev.filter(s => s.id !== id));
        if (user) {
            try {
                if (navigator.onLine) {
                    await ServiceRepository.delete(id);
                } else {
                    throw new Error('Offline');
                }
            } catch (e) {
                import('../services/SyncService').then(({ syncService }) => {
                    syncService.addToQueue({
                        entityId: id,
                        entityType: 'SERVICE',
                        operation: 'DELETE',
                        data: null,
                        userName: user.name
                    });
                });
            }
        }
    };

    const updateService = async (id: number, updates: Partial<Service>) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        if (user) {
            try {
                if (navigator.onLine) {
                    await ServiceRepository.update(id, updates, user.name);
                } else {
                    throw new Error('Offline');
                }
            } catch (e) {
                import('../services/SyncService').then(({ syncService }) => {
                    syncService.addToQueue({
                        entityId: id,
                        entityType: 'SERVICE',
                        operation: 'UPDATE',
                        data: updates,
                        userName: user.name
                    });
                });
            }
        }
    };

    const addExpense = async (expense: Omit<Expense, 'id'>) => {
        const localId = Date.now();
        setExpenses(prev => [{ ...expense, id: localId }, ...prev]);

        if (user) {
            try {
                if (navigator.onLine) {
                    const newExpense = await ExpenseRepository.create(expense, user.name);
                    setExpenses(prev => prev.map(e => e.id === localId ? newExpense : e));
                } else {
                    throw new Error('Offline');
                }
            } catch (error) {
                import('../services/SyncService').then(({ syncService }) => {
                    syncService.addToQueue({
                        entityId: localId,
                        entityType: 'EXPENSE',
                        operation: 'CREATE',
                        data: expense,
                        userName: user.name
                    });
                });
            }
        }
    };

    const deleteExpense = async (id: number) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
        if (user) {
            try {
                if (navigator.onLine) {
                    await ExpenseRepository.delete(id);
                } else {
                    throw new Error('Offline');
                }
            } catch (e) {
                import('../services/SyncService').then(({ syncService }) => {
                    syncService.addToQueue({
                        entityId: id,
                        entityType: 'EXPENSE',
                        operation: 'DELETE',
                        data: null,
                        userName: user.name
                    });
                });
            }
        }
    };

    const updateExpense = async (id: number, updates: Partial<Expense>) => {
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
        if (user) {
            try {
                if (navigator.onLine) {
                    await ExpenseRepository.update(id, updates);
                } else {
                    throw new Error('Offline');
                }
            } catch (e) {
                import('../services/SyncService').then(({ syncService }) => {
                    syncService.addToQueue({
                        entityId: id,
                        entityType: 'EXPENSE',
                        operation: 'UPDATE',
                        data: updates,
                        userName: user.name
                    });
                });
            }
        }
    };

    const addSubscriber = async (data: Omit<Subscriber, 'id' | 'createdAt'>) => {
        const localId = Date.now().toString();
        setSubscribers(prev => [...prev, { ...data, id: localId, createdAt: new Date().toISOString() }]);

        if (user) {
            try {
                if (navigator.onLine) {
                    const newSub = await SubscriberRepository.create(data, user.name);
                    setSubscribers(prev => prev.map(s => s.id === localId ? newSub : s));
                } else {
                    throw new Error('Offline');
                }
            } catch (error) {
                import('../services/SyncService').then(({ syncService }) => {
                    syncService.addToQueue({
                        entityId: localId,
                        entityType: 'SUBSCRIBER',
                        operation: 'CREATE',
                        data: data,
                        userName: user.name
                    });
                });
            }
        }
    };

    const deleteSubscriber = async (id: string) => {
        setSubscribers(prev => prev.filter(s => s.id !== id));
        if (user) {
            try {
                if (navigator.onLine) {
                    await SubscriberRepository.delete(id);
                } else {
                    throw new Error('Offline');
                }
            } catch (e) {
                import('../services/SyncService').then(({ syncService }) => {
                    syncService.addToQueue({
                        entityId: id,
                        entityType: 'SUBSCRIBER',
                        operation: 'DELETE',
                        data: null,
                        userName: user.name
                    });
                });
            }
        }
    };

    const updateSubscriber = async (id: string, updates: Partial<Subscriber>) => {
        setSubscribers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        if (user) {
            try {
                if (navigator.onLine) {
                    await SubscriberRepository.update(id, updates);
                } else {
                    throw new Error('Offline');
                }
            } catch (e) {
                import('../services/SyncService').then(({ syncService }) => {
                    syncService.addToQueue({
                        entityId: id,
                        entityType: 'SUBSCRIBER',
                        operation: 'UPDATE',
                        data: updates,
                        userName: user.name
                    });
                });
            }
        }
    };

    const forceManualSync = async () => {
        setSyncStatus('syncing');
        // Gatillo para la cola offline
        const { syncService } = await import('../services/SyncService');
        await syncService.processQueue();

        await fetchCloudData();
        setSyncStatus('success');
    };

    const updateAnnualConfig = (newConfig: Partial<AnnualConfig>) => {
        setAnnualConfig((prev: AnnualConfig) => ({ ...prev, ...newConfig }));
    };

    return (
        <ServiceContext.Provider value={{
            services, addService, updateService, deleteService,
            expenses, addExpense, updateExpense, deleteExpense,
            subscribers, addSubscriber, updateSubscriber, deleteSubscriber,
            syncStatus, forceManualSync,
            annualConfig, updateAnnualConfig
        }}>
            {children}
        </ServiceContext.Provider>
    );
};

export const useServices = () => {
    const context = useContext(ServiceContext);
    if (!context) throw new Error('useServices must be used within ServiceProvider');
    return context;
};
