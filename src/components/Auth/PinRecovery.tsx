import React, { useState } from 'react';
import { Preferences } from '@capacitor/preferences';
import { useToast } from '../../hooks/useToast';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface PinRecoveryProps {
    onCancel: () => void;
    onSuccess: () => void;
}

const PinRecovery: React.FC<PinRecoveryProps> = ({ onCancel, onSuccess }) => {
    const toast = useToast();
    const [isConfirming, setIsConfirming] = useState<boolean>(false);

    const handleResetPin = async () => {
        try {
            // Eliminar PIN y datos relacionados
            await Preferences.remove({ key: 'pin_enabled' });
            await Preferences.remove({ key: 'app_pin_hash' });
            await Preferences.remove({ key: 'app_pin_salt' });

            toast.success('PIN eliminado. Puedes configurar uno nuevo.');
            onSuccess();
        } catch (error) {
            console.error('Error resetting PIN:', error);
            toast.error('Error al eliminar PIN');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            zIndex: 10000
        }}>
            <div style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}>
                {!isConfirming ? (
                    <>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(234, 179, 8, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem'
                        }}>
                            <AlertTriangle size={32} color="var(--accent-secondary)" />
                        </div>

                        <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', textAlign: 'center' }}>
                            ¿Olvidaste tu PIN?
                        </h2>

                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                            Si has olvidado tu PIN, puedes eliminarlo y configurar uno nuevo.
                            <strong style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                                Tus datos NO se perderán.
                            </strong>
                        </p>

                        <div style={{
                            backgroundColor: 'rgba(234, 179, 8, 0.1)',
                            border: '1px solid var(--accent-secondary)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0 }}>
                                💡 <strong>Nota:</strong> Solo se eliminará el PIN. Todos tus servicios, gastos y configuración se mantendrán intactos.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={onCancel}
                                className="btn"
                                style={{
                                    flex: 1,
                                    backgroundColor: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => setIsConfirming(true)}
                                className="btn"
                                style={{
                                    flex: 1,
                                    backgroundColor: 'var(--accent-secondary)',
                                    color: 'black',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <RefreshCw size={18} />
                                Eliminar PIN
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem'
                        }}>
                            <Trash2 size={32} color="var(--danger)" />
                        </div>

                        <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', textAlign: 'center' }}>
                            Confirmar Eliminación
                        </h2>

                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                            ¿Estás seguro de que quieres eliminar tu PIN de seguridad?
                        </p>

                        <div style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--danger)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0 }}>
                                ⚠️ <strong>Advertencia:</strong> Después de eliminar el PIN, la aplicación quedará sin protección hasta que configures uno nuevo.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setIsConfirming(false)}
                                className="btn"
                                style={{
                                    flex: 1,
                                    backgroundColor: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleResetPin}
                                className="btn"
                                style={{
                                    flex: 1,
                                    backgroundColor: 'var(--danger)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Trash2 size={18} />
                                Sí, Eliminar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PinRecovery;
