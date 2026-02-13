import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../supabase';

interface AuthContextType {
    user: User | null;
    login: (userData: User, rememberMe: boolean) => void;
    logout: () => Promise<void>;
    loading: boolean;
    setAppPin: (pin: string) => void;
    verifyPin: (pin: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user && (session.user.confirmed_at || session.user.email_confirmed_at)) {
                mapSessionToUser(session.user);
            } else {
                setUser(null);
                localStorage.removeItem('codiatax_user');
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user && (session.user.confirmed_at || session.user.email_confirmed_at)) {
                mapSessionToUser(session.user);
            } else {
                setUser(null);
                if (event === 'SIGNED_OUT') {
                    localStorage.removeItem('codiatax_user');
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const mapSessionToUser = (authUser: any) => {
        const metadata = authUser.user_metadata || {};
        const rawRole = metadata.role || 'propietario';
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
        localStorage.setItem('codiatax_user', JSON.stringify(appUser));
        setUser(appUser);
    };

    const login = (userData: User, rememberMe: boolean) => {
        // Legacy support or manual override if needed
        setUser(userData);
        if (rememberMe) {
            localStorage.setItem('codiatax_user', JSON.stringify(userData));
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem('codiatax_user');
    };

    const setAppPin = (pin: string) => {
        localStorage.setItem('codiatax_app_pin', pin);
    };

    const verifyPin = (pin: string): boolean => {
        const saved = localStorage.getItem('codiatax_app_pin');
        return saved === pin;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, setAppPin, verifyPin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
