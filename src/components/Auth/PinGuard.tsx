import React, { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import PinEntry from './PinEntry';

interface PinGuardProps {
    children: React.ReactNode;
}

const PinGuard: React.FC<PinGuardProps> = ({ children }) => {
    const [isLocked, setIsLocked] = useState(false);
    const [pinEnabled, setPinEnabled] = useState(false);
    const [checking, setChecking] = useState(true);

    const checkSecurity = async (isResume = false) => {
        try {
            const { value } = await Preferences.get({ key: 'pin_enabled' });
            if (value === 'true') {
                setPinEnabled(true);
                // If it's a resume event or initial load, we lock
                // Or maybe we only lock if we were away for X time? 
                // For now, strict: always lock on visible if enabled.
                setIsLocked(true);
            } else {
                setPinEnabled(false);
                setIsLocked(false);
            }
        } catch (err) {
            console.error('Security check failed', err);
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        // Initial check
        checkSecurity();

        // Listen for visibility change (background/foreground)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // App came to foreground
                // Re-check security settings and lock if enabled
                checkSecurity(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    if (checking) {
        // Checking state... show nothing or a loader
        return (
            <div style={{
                height: '100vh',
                width: '100vw',
                background: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {/* Optional: Show Logo */}
            </div>
        );
    }

    if (pinEnabled && isLocked) {
        return <PinEntry onSuccess={() => setIsLocked(false)} />;
    }

    return <>{children}</>;
};

export default PinGuard;
