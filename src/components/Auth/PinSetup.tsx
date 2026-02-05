import React, { useState, useEffect } from 'react';
import { encryption } from '../../services/encryption';
import { Preferences } from '@capacitor/preferences';
import { Lock, Check } from 'lucide-react';

interface PinSetupProps {
    onComplete: () => void;
}

const PinSetup: React.FC<PinSetupProps> = ({ onComplete }) => {
    const [pin, setPin] = useState<string>('');
    const [confirmPin, setConfirmPin] = useState<string>('');
    const [step, setStep] = useState<'create' | 'confirm'>('create');
    const [error, setError] = useState<string>('');
    const [salt, setSalt] = useState<string>('');

    useEffect(() => {
        // Generar salt al montar
        setSalt(encryption.generateSalt());
    }, []);

    const handlePinInput = (digit: string) => {
        if (step === 'create') {
            if (pin.length < 6) {
                setPin(pin + digit);
            }
        } else {
            if (confirmPin.length < 6) {
                setConfirmPin(confirmPin + digit);
            }
        }
        setError('');
    };

    const handleDelete = () => {
        if (step === 'create') {
            setPin(pin.slice(0, -1));
        } else {
            setConfirmPin(confirmPin.slice(0, -1));
        }
        setError('');
    };

    const handleContinue = async () => {
        if (step === 'create') {
            if (pin.length < 4) {
                setError('El PIN debe tener al menos 4 dígitos');
                return;
            }
            setStep('confirm');
        } else {
            if (pin !== confirmPin) {
                setError('Los PINs no coinciden');
                setConfirmPin('');
                return;
            }

            // Guardar PIN hasheado con salt
            const hashedPin = encryption.hashWithSalt(pin, salt);

            try {
                await Preferences.set({ key: 'app_pin_hash', value: hashedPin });
                await Preferences.set({ key: 'app_pin_salt', value: salt });
                await Preferences.set({ key: 'pin_enabled', value: 'true' });
                onComplete();
            } catch (error) {
                console.error('Error saving PIN:', error);
                setError('Error al guardar el PIN');
            }
        }
    };

    const currentPin = step === 'create' ? pin : confirmPin;

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
                    backgroundColor: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 2rem'
                }}>
                    <Lock size={40} color="white" />
                </div>

                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    {step === 'create' ? 'Crear PIN de Seguridad' : 'Confirmar PIN'}
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    {step === 'create'
                        ? 'Introduce un PIN de 4-6 dígitos para proteger tus datos'
                        : 'Vuelve a introducir tu PIN para confirmar'
                    }
                </p>

                {/* PIN Dots */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    marginBottom: '3rem'
                }}>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <div
                            key={i}
                            style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: i < currentPin.length ? 'var(--accent-primary)' : 'rgba(255,255,255,0.2)',
                                transition: 'all 0.2s'
                            }}
                        />
                    ))}
                </div>

                {error && (
                    <div style={{
                        color: 'var(--danger)',
                        marginBottom: '1rem',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                {/* Number Pad */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    marginBottom: '1rem'
                }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((num, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                if (num === 'del') handleDelete();
                                else if (num !== '') handlePinInput(num.toString());
                            }}
                            disabled={num === ''}
                            style={{
                                height: '60px',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: num === '' ? 'transparent' : 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                cursor: num === '' ? 'default' : 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (num !== '') {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (num !== '') {
                                    e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                                }
                            }}
                        >
                            {num === 'del' ? '⌫' : num}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleContinue}
                    disabled={currentPin.length < 4}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    {step === 'confirm' && <Check size={20} />}
                    {step === 'create' ? 'Continuar' : 'Confirmar PIN'}
                </button>
            </div>
        </div>
    );
};

export default PinSetup;
