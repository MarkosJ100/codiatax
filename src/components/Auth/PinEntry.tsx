import React, { useState, useEffect } from 'react';
import { encryption } from '../../services/encryption';
import { Preferences } from '@capacitor/preferences';
import { Lock, Delete, Fingerprint } from 'lucide-react';
import { biometricService } from '../../services/biometric';

interface PinEntryProps {
    onSuccess: () => void;
}

const PinEntry: React.FC<PinEntryProps> = ({ onSuccess }) => {
    const [pin, setPin] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Try biometric immediately if available
        checkBiometric();
    }, []);

    const checkBiometric = async () => {
        try {
            const { value } = await Preferences.get({ key: 'biometric_enabled' });
            if (value === 'true') {
                const authenticated = await biometricService.authenticate('Desbloquear CodiaTax');
                if (authenticated) {
                    onSuccess();
                }
            }
        } catch (e) {
            console.error('Biometric check failed', e);
        }
    };

    const handlePinInput = async (digit: string) => {
        const newPin = pin + digit;
        setPin(newPin);
        setError('');

        if (newPin.length === 6) {
            // Auto-verify at 6 digits? Or 4? 
            // PinSetup allows 4-6. We verify when "Continue" is pressed OR automatically if we know logic?
            // Since length is variable (4-6), we usually wait for user to press OK or check length if specific.
            // Let's check `verifyPin` logic. 
            // Actually, best strictly check against hash.
            // But we don't want to hash on every keypress if expensive (scrypt is).
            // Let's add an "Enter" button or just check on 4, 5, 6?
            // Checking on every digit is okay if scrypt parameters are light, but encryption service might be heavy.
            // Let's verify manually via button for safety, OR valid lengths.
        }
    };

    const verifyPin = async (inputPin: string) => {
        setIsLoading(true);
        try {
            const { value: storedHash } = await Preferences.get({ key: 'app_pin_hash' });
            const { value: storedSalt } = await Preferences.get({ key: 'app_pin_salt' });

            if (!storedHash || !storedSalt) {
                setError('Error de configuración de seguridad');
                setIsLoading(false);
                return;
            }

            const inputHash = encryption.hashWithSalt(inputPin, storedSalt);

            if (inputHash === storedHash) {
                onSuccess();
            } else {
                setError('PIN incorrecto');
                setPin('');
            }
        } catch (err) {
            console.error(err);
            setError('Error al verificar PIN');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError('');
    };

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
                    backgroundColor: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 2rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <Lock size={32} color="var(--text-primary)" />
                </div>

                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    Introduce tu PIN
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Aplicación bloqueada por seguridad
                </p>

                {/* PIN Dots */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    marginBottom: '3rem',
                    height: '20px'
                }}>
                    {pin.length > 0 ? (
                        Array(pin.length).fill(0).map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--accent-primary)',
                                }}
                            />
                        ))
                    ) : (
                        <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>...</span>
                    )}
                </div>

                {error && (
                    <div style={{
                        color: 'var(--danger)',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        fontWeight: 500
                    }}>
                        {error}
                    </div>
                )}

                {/* Number Pad */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px',
                    marginBottom: '2rem'
                }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((num, i) => (
                        <React.Fragment key={i}>
                            {num === '' ? (
                                <div />
                            ) : num === 'del' ? (
                                <button
                                    onClick={handleDelete}
                                    style={{
                                        height: '70px',
                                        fontSize: '1.2rem',
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Delete size={24} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => handlePinInput(num.toString())}
                                    disabled={isLoading}
                                    style={{
                                        height: '70px',
                                        fontSize: '1.8rem',
                                        fontWeight: '500',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--bg-card)',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.1s active',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    {num}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => checkBiometric()}
                        className="btn-ghost"
                        style={{ padding: '1rem' }}
                    >
                        <Fingerprint size={24} />
                    </button>

                    <button
                        onClick={() => verifyPin(pin)}
                        disabled={isLoading || pin.length < 4}
                        className="btn btn-primary"
                        style={{
                            padding: '0.8rem 2rem',
                            minWidth: '150px'
                        }}
                    >
                        {isLoading ? 'Verificando...' : 'Desbloquear'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PinEntry;
