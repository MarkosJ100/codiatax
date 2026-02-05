import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';
import { FileDown, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { exportToExcel, exportServicesToCSV, exportExpensesToCSV } from '../../utils/exportData';

const ExportMenu: React.FC = () => {
    const { services, expenses } = useApp();
    const toast = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const handleExportExcel = () => {
        try {
            exportToExcel(services, expenses, `codiatax_completo_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Exportado a Excel correctamente');
            setIsOpen(false);
        } catch (error) {
            toast.error('Error al exportar a Excel');
            console.error(error);
        }
    };

    const handleExportServicesCSV = () => {
        try {
            exportServicesToCSV(services);
            toast.success('Servicios exportados a CSV');
            setIsOpen(false);
        } catch (error) {
            toast.error('Error al exportar servicios');
            console.error(error);
        }
    };

    const handleExportExpensesCSV = () => {
        try {
            exportExpensesToCSV(expenses);
            toast.success('Gastos exportados a CSV');
            setIsOpen(false);
        } catch (error) {
            toast.error('Error al exportar gastos');
            console.error(error);
        }
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn"
                style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0.75rem 1rem'
                }}
            >
                <FileDown size={18} />
                Exportar Datos
                <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    minWidth: '220px',
                    overflow: 'hidden'
                }}>
                    <button
                        onClick={handleExportExcel}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <FileSpreadsheet size={18} color="var(--success)" />
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Excel Completo</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Servicios, gastos y resumen</div>
                        </div>
                    </button>

                    <button
                        onClick={handleExportServicesCSV}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <FileText size={18} color="var(--accent-primary)" />
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>CSV Servicios</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Solo servicios</div>
                        </div>
                    </button>

                    <button
                        onClick={handleExportExpensesCSV}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <FileText size={18} color="var(--danger)" />
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>CSV Gastos</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Solo gastos</div>
                        </div>
                    </button>
                </div>
            )}

            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999
                    }}
                />
            )}
        </div>
    );
};

export default ExportMenu;
