import React, { useState, useTransition, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { isSameDay } from '../../utils/dateHelpers';
import { useToast } from '../../hooks/useToast';
import { Calculator, Save, Gauge, Loader2, Calendar } from 'lucide-react';

const DailyTotalForm: React.FC = () => {
    const {
        addService, updateService,
        addMileageLog, mileageLogs,
        services, expenses,
        addExpense, updateExpense
    } = useApp();
    const toast = useToast();
    const [isPending, startTransition] = useTransition();
    const [serviceDate, setServiceDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Added: Detect individually recorded company services for this date
    const individualCompanyTotal = useMemo(() => {
        const dateObj = new Date(serviceDate);
        return services
            .filter(s => isSameDay(new Date(s.timestamp), dateObj) && s.type === 'company' && s.source !== 'total')
            .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    }, [services, serviceDate]);

    // Detect data for the selected date
    const selectedDateObj = new Date(serviceDate);
    const todayServiceSmart = services.find(s => isSameDay(new Date(s.timestamp), selectedDateObj) && s.observation?.includes('SmartTD'));
    const todayServiceCompany = services.find(s => isSameDay(new Date(s.timestamp), selectedDateObj) && s.observation?.includes('Compañía'));
    const todayMileage = mileageLogs.find(l => isSameDay(new Date(l.timestamp), selectedDateObj));
    const todayExpenses = expenses.find(e => isSameDay(new Date(e.timestamp), selectedDateObj) && e.description?.includes('Resumen'));

    const [smartAmount, setSmartAmount] = useState<string>('');
    const [companyAmount, setCompanyAmount] = useState<string>('');
    const [dailyKm, setDailyKm] = useState<string>('');
    const [dailyExpense, setDailyExpense] = useState<string>('');

    // Use useEffect to update local state when selected date or underlying data changes
    useEffect(() => {
        setSmartAmount(todayServiceSmart ? todayServiceSmart.amount.toString() : '');
        setCompanyAmount(todayServiceCompany ? todayServiceCompany.amount.toString() : '');
        setDailyKm(todayMileage ? todayMileage.amount.toString() : '');
        setDailyExpense(todayExpenses ? todayExpenses.amount.toString() : '');
    }, [serviceDate, todayServiceSmart, todayServiceCompany, todayMileage, todayExpenses]);

    const total = (parseFloat(smartAmount) || 0) + (parseFloat(companyAmount) || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const [year, month, day] = serviceDate.split('-').map(Number);
        const dateObj = new Date();
        dateObj.setFullYear(year);
        dateObj.setMonth(month - 1);
        dateObj.setDate(day);
        const timestamp = dateObj.toISOString();

        startTransition(() => {
            // KM registration
            if (dailyKm) {
                addMileageLog(parseInt(dailyKm));
            }

            // SmartTD Update/Add
            if (parseFloat(smartAmount) > 0) {
                if (todayServiceSmart) {
                    updateService(todayServiceSmart.id, { amount: parseFloat(smartAmount) });
                } else {
                    addService({
                        type: 'normal',
                        amount: parseFloat(smartAmount),
                        observation: 'Resumen Diario - SmartTD',
                        timestamp: timestamp,
                        source: 'total'
                    });
                }
            }

            // Company Update/Add
            if (parseFloat(companyAmount) > 0) {
                if (todayServiceCompany) {
                    updateService(todayServiceCompany.id, { amount: parseFloat(companyAmount) });
                } else {
                    addService({
                        type: 'company',
                        companyName: 'Varios/Totales',
                        amount: parseFloat(companyAmount),
                        observation: 'Resumen Diario - Compañía',
                        timestamp: timestamp,
                        source: 'total'
                    });
                }
            }

            // Expenses Update/Add
            if (parseFloat(dailyExpense) > 0) {
                if (todayExpenses) {
                    updateExpense(todayExpenses.id, { amount: parseFloat(dailyExpense) });
                } else {
                    addExpense({
                        type: 'labor',
                        category: 'Laboral',
                        amount: parseFloat(dailyExpense),
                        description: 'Gastos Diarios - Resumen',
                        timestamp: timestamp
                    });
                }
            }

            toast.success(todayServiceSmart || todayMileage ? 'Resumen actualizado' : 'Resumen guardado');
        });
    };

    return (
        <div className="card" style={{ border: '1px solid var(--accent-primary)' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                <Calculator size={20} style={{ marginRight: '8px', color: 'var(--accent-primary)' }} />
                Resumen Diario Integral
            </h3>

            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Fecha del Resumen</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Calendar size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                    <input
                        type="date"
                        value={serviceDate}
                        onChange={(e) => setServiceDate(e.target.value)}
                        style={{
                            paddingLeft: '40px',
                            width: '100%',
                            border: '1px solid var(--accent-primary)',
                            backgroundColor: 'rgba(59, 130, 246, 0.05)'
                        }}
                    />
                </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
                Importe, Kilómetros y Gastos relacionados para el día seleccionado.
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
                    {individualCompanyTotal > 0 && (
                        <p style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                            💡 Ya has registrado {individualCompanyTotal.toFixed(2)}€ individualmente hoy.
                            <button
                                type="button"
                                onClick={() => setCompanyAmount(individualCompanyTotal.toString())}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', textDecoration: 'underline', marginLeft: '8px', cursor: 'pointer', fontSize: '0.7rem' }}
                            >
                                Usar esta cifra
                            </button>
                        </p>
                    )}
                </div>

                <div>
                    <label style={{ marginBottom: '4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                        <Gauge size={16} style={{ marginRight: '6px' }} /> Kms Recorridos Hoy
                    </label>
                    <input
                        type="number"
                        value={dailyKm} onChange={e => setDailyKm(e.target.value)}
                        placeholder="Ej: 300"
                        style={{ borderLeft: '4px solid var(--accent-primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>Gastos Diarios (€)</label>
                    <input
                        type="number" step="0.01"
                        value={dailyExpense} onChange={e => setDailyExpense(e.target.value)}
                        placeholder="0.00"
                        style={{ borderLeft: '4px solid var(--danger)' }}
                    />
                </div>

                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>BENEFICIO NETO</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: (total - (parseFloat(dailyExpense) || 0)) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {(total - (parseFloat(dailyExpense) || 0)).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                </div>

                <button type="submit" className="btn btn-primary" disabled={isPending}>
                    {isPending ? <Loader2 size={20} className="animate-spin" style={{ marginRight: '8px' }} /> : <Save size={20} style={{ marginRight: '8px' }} />}
                    {isPending ? 'Guardando...' : (todayMileage || todayServiceSmart ? 'Actualizar Resumen' : 'Guardar Resumen')}
                </button>
            </form>
        </div>
    );
};

export default DailyTotalForm;
