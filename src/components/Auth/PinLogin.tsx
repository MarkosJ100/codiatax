import React, { useState, useEffect } from 'react';
import { encryption } from '../../services/encryption';
import { Preferences } from '@capacitor/preferences';
import { rateLimiter } from '../../utils/sanitize';
import { Lock, AlertCircle } from 'lucide-react';
import PinRecovery from './PinRecovery';

interface PinLoginProps {
    onSuccess: () => void;
}

const PinLogin: React.FC<PinLoginProps> = ({ onSuccess }) => {
    const [pin, setPin] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isBlocked, setIsBlocked] = useState<boolean>(false);
    const [blockTimeRemaining, setBlockTimeRemaining] = useState<number>(0);
    const [showRecovery, setShowRecovery] = useState<boolean>(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isBlocked) {
            interval = setInterval(() => {
                const remaining = rateLimiter.getTimeUntilReset('pin_login', 60000);
                setBlockTimeRemaining(Math.ceil(remaining / 1000));

                if (remaining === 0) {
                    setIsBlocked(false);
                    setError('');
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isBlocked]);

    const handlePinInput = (digit: string) => {
        if (pin.length < 6 && !isBlocked) {
            setPin(pin + digit);
            setError('');
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError('');
    };

    const verifyPin = async () => {
        if (pin.length < 4) {
            setError('PIN demasiado corto');
            return;
        }

        // Rate limiting: máximo 5 intentos por minuto
        if (!rateLimiter.canProceed('pin_login', 5, 60000)) {
            setIsBlocked(true);
            const remaining = rateLimiter.getTimeUntilReset('pin_login', 60000);
            setBlockTimeRemaining(Math.ceil(remaining / 1000));
            setError('Demasiados intentos. Espera un momento.');
            setPin('');
            return;
        }

        try {
            const { value: storedHash } = await Preferences.get({ key: 'app_pin_hash' });
            const { value: salt } = await Preferences.get({ key: 'app_pin_salt' });

            if (!storedHash || !salt) {
                setError('Error de configuración');
                return;
            }

            const inputHash = encryption.hashWithSalt(pin, salt);

            if (inputHash === storedHash) {
                rateLimiter.reset('pin_login');
                onSuccess();
            } else {
                setError('PIN incorrecto');
                setPin('');
            }
        } catch (error) {
            console.error('Error verifying PIN:', error);
            setError('Error al verificar PIN');
            setPin('');
        }
    };

    useEffect(() => {
        if (pin.length === 6) {
            verifyPin();
        }
    }, [pin]);

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
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: isBlocked ? 'var(--danger)' : 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 2rem',
                    transition: 'background-color 0.3s'
                }}>
                    {isBlocked ? <AlertCircle size={40} color="white" /> : <Lock size={40} color="white" />}
                </div>

                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    {isBlocked ? 'Bloqueado' : 'Introduce tu PIN'}
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    {isBlocked
                        ? `Espera ${blockTimeRemaining}s antes de intentar de nuevo`
                        : 'Introduce tu PIN para acceder a la aplicación'
                    }
                </p>

                {/* PIN Dots */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    marginBottom: '2rem'
                }}>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <div
                            key={i}
                            style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: i < pin.length
                                    ? (error ? 'var(--danger)' : 'var(--accent-primary)')
                                    : 'rgba(255,255,255,0.2)',
                                transition: 'all 0.2s',
                                animation: error && i < pin.length ? 'shake 0.3s' : 'none'
                            }}
                        />
                    ))}
                </div>

                {error && (
                    <div style={{
                        color: 'var(--danger)',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* Number Pad */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px'
                }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((num, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                if (num === 'del') handleDelete();
                                else if (num !== '') handlePinInput(num.toString());
                            }}
                            disabled={num === '' || isBlocked}
                            style={{
                                height: '60px',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: num === '' ? 'transparent' : 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                cursor: (num === '' || isBlocked) ? 'default' : 'pointer',
                                opacity: isBlocked ? 0.5 : 1,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (num !== '' && !isBlocked) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (num !== '' && !isBlocked) {
                                    e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                                }
                            }}
                        >
                            {num === 'del' ? '⌫' : num}
                        </button>
                    ))}
                </div>
            </div>

            {/* Forgot PIN Link */}
            <button
                onClick={() => setShowRecovery(true)}
                style={{
                    marginTop: '2rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                }}
            >
                ¿Olvidaste tu PIN?
            </button>

            {/* Recovery Modal */}
            {showRecovery && (
                <PinRecovery
                    onCancel={() => setShowRecovery(false)}
                    onSuccess={() => {
                        setShowRecovery(false);
                        onSuccess();
                    }}
                />
            )}

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `}</style>
        </div>
    );
};

export default PinLogin;
