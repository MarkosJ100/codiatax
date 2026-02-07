import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Gauge, Plus } from 'lucide-react';

const MileageWidget: React.FC = () => {
    const { currentOdometer, addMileageLog } = useApp();
    const [inputKm, setInputKm] = useState<string>('');
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const handleUpdate = () => {
        if (inputKm) {
            addMileageLog(parseInt(inputKm));
            setInputKm('');
            setIsEditing(false);
        }
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
                    <Gauge size={20} style={{ marginRight: '8px', color: 'var(--accent-primary)' }} />
                    Kilómetros Recorridos Diarios
                </h3>
                <button onClick={() => setIsEditing(!isEditing)} className="btn-ghost" style={{ fontSize: '0.8rem', padding: '4px 8px', cursor: 'pointer', border: 'none', background: 'none', color: 'var(--text-secondary)' }}>
                    {isEditing ? 'Cancelar' : 'Añadir Recorrido'}
                </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {currentOdometer.toLocaleString()}
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginLeft: '8px' }}>km totales</span>
            </div>

            {isEditing && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                    <input
                        type="number"
                        placeholder="Kms recorridos hoy"
                        value={inputKm}
                        onChange={(e) => setInputKm(e.target.value)}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    />
                    <button onClick={handleUpdate} className="btn btn-primary" style={{ width: '50px', padding: 0, borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>
                        <Plus size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default MileageWidget;
