import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

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
    const USER_KEY = 'codiatx_user';
    const LEGACY_USER_KEY = 'codiatax_user';
    const APP_PIN_KEY = 'codiatx_app_pin';
    const LEGACY_APP_PIN_KEY = 'codiatax_app_pin';

    function mapSessionToUser(authUser: SupabaseUser) {
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
            shiftType: metadata.shiftType || 'ma�ana',
            startTime: metadata.startTime || '06:00',
            endTime: metadata.endTime || '15:00',
            lastLogin: new Date().toISOString()
        };
        localStorage.setItem(USER_KEY, JSON.stringify(appUser));
        localStorage.removeItem(LEGACY_USER_KEY);
        setUser(appUser);
    }

    useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && (session.user.confirmed_at || session.user.email_confirmed_at)) {
        mapSessionToUser(session.user);
      } else {
        setUser(null);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(LEGACY_USER_KEY);
      }
      setLoading(false);
    }).catch(() => {
      // If the session check fails (e.g. no network), just stop loading
      setLoading(false);
    });

    // Safety net: if session check never resolves (rare), unblock after 8s
    // IMPORTANT: only sets loading=false, never clears the user session
    const loadingFallback = setTimeout(() => {
      setLoading((prev) => {
        if (prev) return false; // only if still loading
        return prev;
      });
    }, 8000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user && (session.user.confirmed_at || session.user.email_confirmed_at)) {
                mapSessionToUser(session.user);
            } else {
                setUser(null);
                if (event === 'SIGNED_OUT') {
                    localStorage.removeItem(USER_KEY);
                    localStorage.removeItem(LEGACY_USER_KEY);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(loadingFallback);
        };
    }, []);

    const login = (userData: User, rememberMe: boolean) => {
        setUser(userData);
        if (rememberMe) {
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
            localStorage.removeItem(LEGACY_USER_KEY);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(LEGACY_USER_KEY);
    };

    const setAppPin = (pin: string) => {
        localStorage.setItem(APP_PIN_KEY, pin);
        localStorage.removeItem(LEGACY_APP_PIN_KEY);
    };

    const verifyPin = (pin: string): boolean => {
        const saved = localStorage.getItem(APP_PIN_KEY) || localStorage.getItem(LEGACY_APP_PIN_KEY);
        if (!localStorage.getItem(APP_PIN_KEY) && saved) {
            localStorage.setItem(APP_PIN_KEY, saved);
            localStorage.removeItem(LEGACY_APP_PIN_KEY);
        }
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

