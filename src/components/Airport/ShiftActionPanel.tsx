import React from 'react';
import { AlertCircle, RefreshCcw, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={{
                    marginTop: '1.5rem',
                    padding: '1.5rem',
                    borderRadius: '24px',
                    backgroundColor: 'var(--bg-card)',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
                    border: '1px solid var(--accent-primary)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Decorative background circle */}
                <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'rgba(250, 204, 21, 0.05)',
                    zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(250, 204, 21, 0.1)', color: 'var(--accent-primary)' }}>
                            <AlertCircle size={20} />
                        </div>
                        <span style={{ fontWeight: '950', fontSize: '1rem', letterSpacing: '-0.02em' }}>Acción: {selectedDate}</span>
                        <button 
                            onClick={() => { setShowModifyConfirmation(false); setShowTypeSelection(false); }} 
                            style={{ marginLeft: 'auto', background: 'var(--bg-secondary)', border: 'none', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {showTypeSelection && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', lineHeight: '1.5' }}>
                                Selecciona el tipo de turno para iniciar el ciclo recurrente de 11 días:
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <motion.button 
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => confirmShiftWithType('standard')} 
                                    style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '8px', 
                                        padding: '1.25rem',
                                        background: 'var(--accent-primary)',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '20px',
                                        fontWeight: '950',
                                        cursor: 'pointer',
                                        boxShadow: '0 8px 16px -4px rgba(250, 204, 21, 0.4)'
                                    }}
                                >
                                    <CheckCircle2 size={24} />
                                    <span>Normal</span>
                                </motion.button>
                                <motion.button 
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => confirmShiftWithType('full')} 
                                    style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '8px', 
                                        padding: '1.25rem',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-light)',
                                        borderRadius: '20px',
                                        fontWeight: '950',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <span>Dia Completo</span>
                                </motion.button>
                            </div>
                        </div>
                    )}

                    {showModifyConfirmation && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                    <RefreshCcw size={24} />
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', margin: 0 }}>
                                    Este día ya tiene un turno. ¿Deseas reiniciar el ciclo recurrente a partir de aquí?
                                </p>
                            </div>
                            <motion.button 
                                whileTap={{ scale: 0.98 }}
                                onClick={handleModifyCycle} 
                                style={{ 
                                    width: '100%',
                                    padding: '1.15rem',
                                    borderRadius: '18px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: '950',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.3)'
                                }}
                            >
                                <RefreshCcw size={20} /> Reiniciar Ciclo Completo
                            </motion.button>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ShiftActionPanel;
