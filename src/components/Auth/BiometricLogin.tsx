import React, { useState, useEffect } from 'react';
import { biometricService } from '../../services/biometric';
import { Fingerprint, AlertCircle } from 'lucide-react';
import PinLogin from './PinLogin';

interface BiometricLoginProps {
    onSuccess: () => void;
}

const BiometricLogin: React.FC<BiometricLoginProps> = ({ onSuccess }) => {
    const [showPinFallback, setShowPinFallback] = useState<boolean>(false);
    const [isAvailable, setIsAvailable] = useState<boolean>(false);

    useEffect(() => {
        checkBiometry();
    }, []);

    const checkBiometry = async () => {
        const available = await biometricService.isAvailable();
        setIsAvailable(available);

        // Si no está disponible, mostrar PIN directamente
        if (!available) {
            setShowPinFallback(true);
        }
    };

    // Si biometría no está disponible o usuario eligió PIN, mostrar PIN
    if (showPinFallback || !isAvailable) {
        return <PinLogin onSuccess={onSuccess} />;
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            zIndex: 9999
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 2rem'
                }}>
                    <AlertCircle size={60} color="white" />
                </div>

                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    Biometría No Disponible
                </h2>

                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    La autenticación biométrica no está disponible en este dispositivo
                </p>

                <button
                    onClick={() => setShowPinFallback(true)}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1rem'
                    }}
                >
                    Usar PIN
                </button>
            </div>
        </div>
    );
};

export default BiometricLogin;
