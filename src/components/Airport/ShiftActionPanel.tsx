import React from 'react';
import { AlertCircle, RefreshCcw, XCircle, CheckCircle2 } from 'lucide-react';

interface ShiftActionPanelProps {
    selectedDate: string;
    showModifyConfirmation: boolean;
    setShowModifyConfirmation: (show: boolean) => void;
    showTypeSelection: boolean;
    setShowTypeSelection: (show: boolean) => void;
    confirmShiftWithType: (type: string) => void;
    handleModifyCycle: () => void;
    isShiftDay: (date: Date) => boolean;
}

const ShiftActionPanel: React.FC<ShiftActionPanelProps> = ({
    selectedDate,
    showModifyConfirmation,
    setShowModifyConfirmation,
    showTypeSelection,
    setShowTypeSelection,
    confirmShiftWithType,
    handleModifyCycle
}) => {
    if (!showTypeSelection && !showModifyConfirmation) return null;

    return (
        <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--accent-primary)',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <AlertCircle size={20} color="var(--accent-primary)" />
                <span style={{ fontWeight: 'bold' }}>Acción para el {selectedDate}</span>
                <button onClick={() => { setShowModifyConfirmation(false); setShowTypeSelection(false); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <XCircle size={20} />
                </button>
            </div>

            {showTypeSelection && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Selecciona el tipo de turno para iniciar el ciclo de 11 días:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button onClick={() => confirmShiftWithType('standard')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px' }}>
                            <CheckCircle2 size={18} /> Normal
                        </button>
                        <button onClick={() => confirmShiftWithType('full')} className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                            <CheckCircle2 size={18} /> Día Completo
                        </button>
                    </div>
                </div>
            )}

            {showModifyConfirmation && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Este día ya tiene un turno. ¿Deseas reiniciar el ciclo a partir de aquí?</p>
                    <button onClick={handleModifyCycle} className="btn" style={{ padding: '12px', backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <RefreshCcw size={18} /> Eliminar Turnos Futuros y Reiniciar
                    </button>
                </div>
            )}
        </div>
    );
};

export default ShiftActionPanel;
