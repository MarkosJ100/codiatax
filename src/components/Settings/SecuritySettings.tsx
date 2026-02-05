import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';
import { Preferences } from '@capacitor/preferences';
import { Shield, Lock, Key, AlertTriangle, Fingerprint } from 'lucide-react';
import PinSetup from '../Auth/PinSetup';
import { biometricService } from '../../services/biometric';

const SecuritySettings: React.FC = () => {
    const { user } = useApp();
    const toast = useToast();
    const [pinEnabled, setPinEnabled] = useState<boolean>(false);
    const [showPinSetup, setShowPinSetup] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
    const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);
    const [biometryName, setBiometryName] = useState<string>('Biometría');

    React.useEffect(() => {
        checkPinStatus();
        checkBiometricAvailability();
    }, []);

    const checkPinStatus = async () => {
        try {
            const { value } = await Preferences.get({ key: 'pin_enabled' });
            setPinEnabled(value === 'true');
        } catch (error) {
            console.error('Error checking PIN status:', error);
        }
    };

    const checkBiometricAvailability = async () => {
        try {
            const info = await biometricService.getBiometricInfo();
            setBiometricAvailable(info.isAvailable);
            setBiometryName(info.biometryType === 'fingerprint' ? 'Huella Dactilar' :
                info.biometryType === 'face' ? 'Face ID' :
                    info.biometryType === 'iris' ? 'Iris' : 'Biometría');

            const { value } = await Preferences.get({ key: 'biometric_enabled' });
            setBiometricEnabled(value === 'true');
        } catch (error) {
            console.error('Error checking biometric availability:', error);
        }
    };

    const handleTogglePin = async () => {
        if (pinEnabled) {
            // Desactivar PIN
            if (confirm('¿Estás seguro de que quieres desactivar el PIN? Tus datos estarán menos protegidos.')) {
                try {
                    await Preferences.remove({ key: 'pin_enabled' });
                    await Preferences.remove({ key: 'app_pin_hash' });
                    await Preferences.remove({ key: 'app_pin_salt' });
                    setPinEnabled(false);
                    toast.success('PIN desactivado');
                } catch (error) {
                    toast.error('Error al desactivar PIN');
                }
            }
        } else {
            // Activar PIN
            setShowPinSetup(true);
        }
    };

    const handlePinSetupComplete = () => {
        setShowPinSetup(false);
        setPinEnabled(true);
        toast.success('PIN configurado correctamente');
    };

    const handleToggleBiometric = async () => {
        if (!biometricAvailable) {
            toast.error(`${biometryName} no está disponible en este dispositivo`);
            return;
        }

        if (biometricEnabled) {
            // Desactivar biometría
            try {
                await Preferences.remove({ key: 'biometric_enabled' });
                setBiometricEnabled(false);
                toast.success(`${biometryName} desactivada`);
            } catch (error) {
                toast.error('Error al desactivar biometría');
            }
        } else {
            // Activar biometría - primero verificar que funciona
            const success = await biometricService.authenticate(
                `Verifica tu ${biometryName.toLowerCase()} para activarla`
            );

            if (success) {
                try {
                    await Preferences.set({ key: 'biometric_enabled', value: 'true' });
                    setBiometricEnabled(true);
                    toast.success(`${biometryName} activada correctamente`);
                } catch (error) {
                    toast.error('Error al activar biometría');
                }
            } else {
                toast.error('Autenticación biométrica cancelada');
            }
        }
    };

    if (showPinSetup) {
        return <PinSetup onComplete={handlePinSetupComplete} />;
    }

    return (
        <div className="card" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <Shield size={24} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Seguridad</h3>
            </div>

            {/* PIN Protection */}
            <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock size={20} color={pinEnabled ? 'var(--success)' : 'var(--text-muted)'} />
                        <span style={{ fontWeight: 500 }}>Protección con PIN</span>
                    </div>
                    <button
                        onClick={handleTogglePin}
                        className="btn"
                        style={{
                            backgroundColor: pinEnabled ? 'var(--success)' : 'var(--bg-card)',
                            color: pinEnabled ? 'white' : 'var(--text-primary)',
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem'
                        }}
                    >
                        {pinEnabled ? 'Activado' : 'Activar'}
                    </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    {pinEnabled
                        ? 'Tu aplicación está protegida con un PIN de seguridad'
                        : 'Protege tu aplicación con un PIN de 4-6 dígitos'
                    }
                </p>
            </div>

            {/* Biometric Authentication */}
            {biometricAvailable && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Fingerprint size={20} color={biometricEnabled ? 'var(--success)' : 'var(--text-muted)'} />
                            <span style={{ fontWeight: 500 }}>{biometryName}</span>
                        </div>
                        <button
                            onClick={handleToggleBiometric}
                            className="btn"
                            style={{
                                backgroundColor: biometricEnabled ? 'var(--success)' : 'var(--bg-card)',
                                color: biometricEnabled ? 'white' : 'var(--text-primary)',
                                padding: '0.5rem 1rem',
                                fontSize: '0.85rem'
                            }}
                        >
                            {biometricEnabled ? 'Activado' : 'Activar'}
                        </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                        {biometricEnabled
                            ? `Accede rápidamente con tu ${biometryName.toLowerCase()}`
                            : `Usa tu ${biometryName.toLowerCase()} para acceder más rápido`
                        }
                    </p>
                </div>
            )}

            {/* Data Encryption */}
            <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                    <Key size={20} color="var(--success)" />
                    <span style={{ fontWeight: 500 }}>Encriptación de Datos</span>
                    <span style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        backgroundColor: 'var(--success)',
                        color: 'white',
                        borderRadius: '12px',
                        marginLeft: 'auto'
                    }}>
                        ACTIVO
                    </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    Tus datos sensibles están encriptados con AES-256
                </p>
            </div>

            {/* Security Info */}
            <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid var(--accent-secondary)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                gap: '12px'
            }}>
                <AlertTriangle size={20} color="var(--accent-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0 0 8px 0', fontWeight: 500 }}>
                        Consejos de Seguridad
                    </p>
                    <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '1.2rem' }}>
                        <li>No compartas tu PIN con nadie</li>
                        <li>Usa un PIN único que no uses en otros sitios</li>
                        <li>Haz copias de seguridad regularmente</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
