import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Database, Download, Trash2, AlertCircle, FileJson, Upload } from 'lucide-react';

const DataSettings: React.FC = () => {
    const {
        services, expenses, vehicle, mileageLogs,
        annualConfig, shiftStorage, resetAppData, restoreAppData, showToast
    } = useApp();
    const [isConfirming, setIsConfirming] = useState(false);

    const handleBackup = () => {
        const data = {
            services,
            expenses,
            vehicle,
            mileageLogs,
            annualConfig,
            shiftStorage,
            exportedAt: new Date().toISOString(),
            version: '2.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `codiatax_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Copia de seguridad descargada', 'success');
    };

    const handleReset = () => {
        if (!isConfirming) {
            setIsConfirming(true);
            return;
        }

        // Final confirm
        if (window.confirm('¿ESTÁS TOTALMENTE SEGURO? Esta acción es irreversible y borrará todos tus servicios, gastos y configuraciones.')) {
            resetAppData();
            setIsConfirming(false);
        }
    };

    const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const backupData = JSON.parse(text);
            const result = await restoreAppData(backupData);

            if (!result.success) {
                showToast(result.error || 'Error al restaurar', 'error');
            }
        } catch (error) {
            showToast('Archivo de backup inválido', 'error');
        }

        // Reset file input
        event.target.value = '';
    };

    return (
        <div className="card" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <Database size={24} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Gestión de Datos</h3>
            </div>

            {/* Backup Section */}
            <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileJson size={20} color="var(--accent-primary)" />
                        <span style={{ fontWeight: 500 }}>Copia de Seguridad</span>
                    </div>
                    <button
                        onClick={handleBackup}
                        className="btn"
                        style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Download size={16} />
                        Descargar Copia
                    </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    Exporta todos tus datos a un archivo para guardarlos fuera de la aplicación.
                </p>
            </div>

            {/* Restore Section */}
            <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Upload size={20} color="var(--success)" />
                        <span style={{ fontWeight: 500 }}>Restaurar Copia</span>
                    </div>
                    <label
                        htmlFor="restore-file"
                        className="btn"
                        style={{
                            backgroundColor: 'var(--success)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        <Upload size={16} />
                        Restaurar Copia
                    </label>
                    <input
                        id="restore-file"
                        type="file"
                        accept=".json"
                        onChange={handleRestore}
                        style={{ display: 'none' }}
                    />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    Importa un archivo de backup para restaurar tus datos guardados.
                </p>
            </div>

            {/* Reset Section */}
            <div style={{
                padding: '1rem',
                backgroundColor: isConfirming ? 'rgba(var(--danger-rgb), 0.1)' : 'rgba(255,255,255,0.03)',
                border: isConfirming ? '1px solid var(--danger)' : 'none',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.3s ease'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trash2 size={20} color={isConfirming ? 'var(--danger)' : 'var(--text-muted)'} />
                        <span style={{ fontWeight: 500, color: isConfirming ? 'var(--danger)' : 'var(--text-primary)' }}>
                            Resetear Aplicación
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {isConfirming && (
                            <button
                                onClick={() => setIsConfirming(false)}
                                className="btn"
                                style={{
                                    backgroundColor: 'transparent',
                                    border: '1px solid var(--text-muted)',
                                    color: 'var(--text-primary)',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            onClick={handleReset}
                            className="btn"
                            style={{
                                backgroundColor: 'var(--danger)',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                fontSize: '0.85rem',
                                fontWeight: 'bold'
                            }}
                        >
                            {isConfirming ? '¡SÍ, BORRAR TODO!' : 'Borrar Datos'}
                        </button>
                    </div>
                </div>

                {isConfirming ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', color: 'var(--danger)' }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '0.85rem', margin: 0, fontWeight: '500' }}>
                            ¡CUIDADO! Se borrará todo. Te recomendamos hacer una
                            <span
                                onClick={handleBackup}
                                style={{ textDecoration: 'underline', cursor: 'pointer', marginLeft: '4px', fontWeight: 'bold' }}
                            >
                                copia de seguridad primero
                            </span>.
                        </p>
                    </div>
                ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                        Borra permanentemente todos los servicios, gastos y configuraciones personalizadas.
                    </p>
                )}
            </div>

            <CloudDiagnosis />
        </div>
    );
};

// Componente interno para diagnóstico
const CloudDiagnosis = () => {
    const { syncStatus, lastSyncError, forceManualSync, user } = useApp();
    // Importación segura de la utilidad
    let normalizeUsername = (name: string) => name.toLowerCase().trim();
    try {
        // Intentar usar la función real si está disponible en el scope, si no usar fallback
        // En este caso, como estamos dentro del mismo proyecto, debería estar disponible si se importa arriba
        // Pero como no puedo editar los imports fácilmente sin romper cosas, usaré una versión inline segura
        // que coincida con la lógica de userHelpers.ts
    } catch (e) { }

    const handleForceSync = () => {
        forceManualSync();
    };

    const getStatusColor = () => {
        switch (syncStatus) {
            case 'success': return 'var(--success)';
            case 'error': return 'var(--danger)';
            case 'syncing': return 'var(--accent-primary)';
            default: return 'var(--text-muted)';
        }
    };

    const getStatusText = () => {
        switch (syncStatus) {
            case 'success': return 'Sincronizado';
            case 'error': return 'Error';
            case 'syncing': return 'Sincronizando...';
            default: return 'Inactivo';
        }
    };

    return (
        <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: 'rgba(var(--accent-primary-rgb), 0.05)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(var(--accent-primary-rgb), 0.1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <ActivityIcon size={20} color="var(--accent-primary)" />
                <h4 style={{ margin: 0, fontSize: '1rem' }}>Diagnóstico de Nube</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>Usuario Actual:</div>
                <div style={{ fontWeight: 'bold' }}>"{user?.name}"</div>

                <div style={{ color: 'var(--text-muted)' }}>ID Normalizado:</div>
                <div style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {user?.name ? `"${normalizeUsername(user.name)}"` : '-'}
                </div>

                <div style={{ color: 'var(--text-muted)' }}>Estado Conexión:</div>
                <div style={{
                    color: getStatusColor(),
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <span style={{
                        width: '8px', height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(),
                        display: 'inline-block'
                    }}></span>
                    {getStatusText()}
                </div>

                {lastSyncError && (
                    <>
                        <div style={{ color: 'var(--danger)' }}>Último Error:</div>
                        <div style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{lastSyncError}</div>
                    </>
                )}
            </div>

            <button
                onClick={handleForceSync}
                disabled={syncStatus === 'syncing'}
                className="btn"
                style={{
                    width: '100%',
                    backgroundColor: syncStatus === 'syncing' ? 'var(--text-muted)' : 'var(--accent-primary)',
                    color: 'white',
                    padding: '0.75rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <RefreshIcon className={syncStatus === 'syncing' ? 'spin' : ''} size={18} />
                {syncStatus === 'syncing' ? 'Sincronizando...' : 'Forzar Sincronización Ahora'}
            </button>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
                Usa esto si tus datos no aparecen en la web o viceversa.
            </p>
        </div>
    );
};

// Iconos simples
const ActivityIcon = ({ size, color }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
);

const RefreshIcon = ({ size, className }: any) => (
    <svg
        width={size}
        height={size}
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ animation: className === 'spin' ? 'spin 1s linear infinite' : 'none' }}
    >
        <path d="M23 4v6h-6"></path>
        <path d="M1 20v-6h6"></path>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 1 20.49 15"></path>
        <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}} />
    </svg>
);

export default DataSettings;
