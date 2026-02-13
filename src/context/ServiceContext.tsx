import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Service, Expense, Subscriber } from '../types';
import { supabase } from '../supabase';
import { normalizeUsername } from '../utils/userHelpers';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';

interface ServiceContextType {
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
    annualConfig: any;
    updateAnnualConfig: (config: any) => void;
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
    const [annualConfig, setAnnualConfig] = useState<any>(() => {
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
            const uid = normalizeUsername(user.name);
            const [sRes, eRes, subRes] = await Promise.all([
                supabase.from('servicios').select('*').eq('user_id', uid),
                supabase.from('gastos').select('*').eq('user_id', uid),
                supabase.from('abonados').select('*').eq('user_id', uid)
            ]);

            if (sRes.data) {
                const mapped = sRes.data.map((s: any) => ({
                    id: s.id, timestamp: s.timestamp, amount: s.amount, type: s.type,
                    companyName: s.company_name, observation: s.observation
                }));
                setServices(mapped.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            }
            if (eRes.data) {
                setExpenses(eRes.data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            }
            if (subRes.data) {
                const mappedSubs = subRes.data.map((s: any) => ({
                    id: s.id, name: s.name, officeNumber: s.office_number,
                    isCapped: s.is_capped, capAmount: s.cap_amount, createdAt: s.created_at
                }));
                setSubscribers(mappedSubs);
            }
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
        const newService = { ...service, id: Date.now() };
        setServices(prev => [newService, ...prev]);
        if (user) {
            const uid = normalizeUsername(user.name);
            try {
                await supabase.from('servicios').insert([{
                    id: newService.id, timestamp: newService.timestamp, amount: newService.amount,
                    type: newService.type, company_name: newService.companyName,
                    observation: newService.observation, user_id: uid
                }]);
                showToast('Servicio guardado en nube', 'success');
            } catch (error) {
                showToast('Guardado local (sin conexión)', 'warning');
            }
        }
    };

    const deleteService = (id: number) => {
        setServices(prev => prev.filter(s => s.id !== id));
        if (user) supabase.from('servicios').delete().eq('id', id);
    };

    const updateService = (id: number, updates: Partial<Service>) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        // Full update logic omitted for brevity, simpler to delete/insert or use upsert
        if (user) {
            // Re-sync specific item logic or rely on background sync
            // For now, implementing direct update for critical fields
            const s = services.find(x => x.id === id);
            if (s) {
                const merged = { ...s, ...updates };
                const uid = normalizeUsername(user.name);
                supabase.from('servicios').upsert({
                    id: merged.id, timestamp: merged.timestamp, amount: merged.amount,
                    type: merged.type, company_name: merged.companyName,
                    observation: merged.observation, user_id: uid
                });
            }
        }
    };

    // Expenses & Subscribers (Simplified similar logic)
    const addExpense = (expense: Omit<Expense, 'id'>) => {
        const newExpense = { ...expense, id: Date.now() };
        setExpenses(prev => [newExpense, ...prev]);
        if (user) {
            const uid = normalizeUsername(user.name);
            supabase.from('gastos').insert([{ ...newExpense, user_id: uid }]);
        }
    };

    const deleteExpense = (id: number) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
        if (user) supabase.from('gastos').delete().eq('id', id);
    };

    const updateExpense = (id: number, updates: Partial<Expense>) => {
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
        // Sync logic
    };

    const addSubscriber = (data: Omit<Subscriber, 'id' | 'createdAt'>) => {
        const newSub = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
        setSubscribers(prev => [...prev, newSub]);
        if (user) {
            const uid = normalizeUsername(user.name);
            supabase.from('abonados').insert([{
                id: newSub.id, name: newSub.name, office_number: newSub.officeNumber,
                is_capped: newSub.isCapped, cap_amount: newSub.capAmount,
                created_at: newSub.createdAt, user_id: uid
            }]);
        }
    };

    const deleteSubscriber = (id: string) => {
        setSubscribers(prev => prev.filter(s => s.id !== id));
        if (user) supabase.from('abonados').delete().eq('id', id);
    };

    const updateSubscriber = (id: string, updates: Partial<Subscriber>) => {
        setSubscribers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const forceManualSync = async () => {
        setSyncStatus('syncing');
        await fetchCloudData();
        setSyncStatus('success');
    };

    const updateAnnualConfig = (newConfig: any) => {
        setAnnualConfig((prev: any) => ({ ...prev, ...newConfig }));
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
