import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';
import { Calculator, Save, Gauge } from 'lucide-react';

const DailyTotalForm: React.FC = () => {
    const { addService, addMileageLog } = useApp();
    const toast = useToast();

    const [smartAmount, setSmartAmount] = useState<string>('');
    const [companyAmount, setCompanyAmount] = useState<string>('');
    const [dailyKm, setDailyKm] = useState<string>('');

    const total = (parseFloat(smartAmount) || 0) + (parseFloat(companyAmount) || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (total <= 0) return;

        const now = new Date().toISOString();

        if (parseFloat(smartAmount) > 0) {
            addService({
                type: 'normal',
                amount: parseFloat(smartAmount),
                observation: 'Resumen Diario - SmartTD',
                timestamp: now
            });
        }

        if (parseFloat(companyAmount) > 0) {
            addService({
                type: 'company',
                companyName: 'Varios/Totales',
                amount: parseFloat(companyAmount),
                observation: 'Resumen Diario - Compañía',
                timestamp: now
            });
        }

        if (dailyKm) {
            addMileageLog(parseInt(dailyKm));
        }

        setSmartAmount('');
        setCompanyAmount('');
        setDailyKm('');
        toast.success('Resumen diario guardado correctamente');
    };

    return (
        <div className="card" style={{ border: '1px solid var(--accent-primary)' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                <Calculator size={20} style={{ marginRight: '8px', color: 'var(--accent-primary)' }} />
                Servicios Totales Diarios
            </h3>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
                Nota: Sacado del SmartTD
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>Importe Taxímetro / Efectivo (€)</label>
                    <input
                        type="number" step="0.01"
                        value={smartAmount} onChange={e => setSmartAmount(e.target.value)}
                        placeholder="0.00"
                        style={{ fontSize: '1.1rem' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>Importe Compañía / Vales (€)</label>
                    <input
                        type="number" step="0.01"
                        value={companyAmount} onChange={e => setCompanyAmount(e.target.value)}
                        placeholder="0.00"
                        style={{ fontSize: '1.1rem' }}
                    />
                </div>

                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>TOTAL TOTAL</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                        {total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                </div>

                <div>
                    <label style={{ marginBottom: '4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                        <Gauge size={16} style={{ marginRight: '6px' }} /> Kms Diarios Totales
                    </label>
                    <input
                        type="number"
                        value={dailyKm} onChange={e => setDailyKm(e.target.value)}
                        placeholder="Ej: 300"
                    />
                </div>

                <button type="submit" className="btn btn-primary" disabled={total <= 0}>
                    <Save size={20} style={{ marginRight: '8px' }} /> Guardar Resumen
                </button>
            </form>
        </div>
    );
};

export default DailyTotalForm;
