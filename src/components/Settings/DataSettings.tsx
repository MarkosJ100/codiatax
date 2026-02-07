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
                        Descargar JSON
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
                        Subir JSON
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
        </div>
    );
};

export default DataSettings;
