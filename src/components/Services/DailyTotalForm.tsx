import React, { useState, useTransition, useEffect, useMemo } from 'react';
import { isSameDay } from '../../utils/dateHelpers';
import { useToast } from '../../hooks/useToast';
import { Calculator, Save, Gauge, Loader2, Calendar, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useServices } from '../../context/ServiceContext';
import { useVehicle } from '../../context/VehicleContext';

const DailyTotalForm: React.FC = () => {
    const {
        addService, updateService,
        services, expenses,
        addExpense, updateExpense
    } = useServices();
    const {
        addMileageLog, mileageLogs
    } = useVehicle();
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

    const totalIncome = (parseFloat(smartAmount) || 0) + (parseFloat(companyAmount) || 0);
    const totalExpense = parseFloat(dailyExpense) || 0;
    const netProfit = totalIncome - totalExpense;

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
                addMileageLog({ amount: parseInt(dailyKm), timestamp });
            }

            // Taxímetro Update/Add
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
        <div className="card" style={{ padding: 0, boxShadow: 'var(--shadow-premium)', overflow: 'hidden' }}>
            <div 
                style={{ 
                    padding: '1.25rem 1.5rem', 
                    background: 'var(--bg-body)', 
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}
            >
                <div style={{ padding: '8px', background: 'rgba(var(--accent-primary-rgb), 0.1)', borderRadius: '12px' }}>
                    <Calculator size={20} color="var(--accent-primary)" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '850', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    Resumen Diario Integral
                </h3>
            </div>

            <div style={{ padding: '1.5rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Fecha */}
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: '750', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Fecha del Resumen</label>
                        <div className="input-with-icon" style={{ background: 'var(--bg-body)', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
                            <Calendar size={18} color="var(--accent-primary)" />
                            <input
                                type="date"
                                value={serviceDate}
                                onChange={(e) => setServiceDate(e.target.value)}
                                style={{ background: 'transparent', border: 'none', fontWeight: '600', color: 'var(--text-primary)' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="form-label" style={{ fontWeight: '750', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>🚖 Taxímetro (€)</label>
                            <input
                                type="number" step="0.01"
                                value={smartAmount} onChange={e => setSmartAmount(e.target.value)}
                                placeholder="0.00"
                                style={{ 
                                    fontSize: '1.1rem', 
                                    fontWeight: '800',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    backgroundColor: 'var(--bg-body)',
                                    border: '1px solid var(--border-light)',
                                    color: 'var(--text-primary)',
                                    width: '100%'
                                }}
                            />
                        </div>
                        <div>
                            <label className="form-label" style={{ fontWeight: '750', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>🏢 Compañía (€)</label>
                            <input
                                type="number" step="0.01"
                                value={companyAmount} onChange={e => setCompanyAmount(e.target.value)}
                                placeholder="0.00"
                                style={{ 
                                    fontSize: '1.1rem', 
                                    fontWeight: '800',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    backgroundColor: 'var(--bg-body)',
                                    border: '1px solid var(--border-light)',
                                    color: 'var(--text-primary)',
                                    width: '100%'
                                }}
                            />
                        </div>
                    </div>

                    {individualCompanyTotal > 0 && (
                        <div style={{ 
                            padding: '10px 14px', 
                            background: 'rgba(139, 92, 246, 0.05)', 
                            borderRadius: '12px', 
                            border: '1px dashed #8b5cf6',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: '700' }}>
                                Individual hoy: {individualCompanyTotal.toFixed(2)}€
                            </span>
                            <button
                                type="button"
                                onClick={() => setCompanyAmount(individualCompanyTotal.toString())}
                                style={{ background: '#8b5cf6', border: 'none', color: 'white', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: '800' }}
                            >
                                Usar cifra
                            </button>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="form-label" style={{ fontWeight: '750', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                <Gauge size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Km Hoy
                            </label>
                            <input
                                type="number"
                                value={dailyKm} onChange={e => setDailyKm(e.target.value)}
                                placeholder="Ej: 300"
                                style={{ 
                                    fontSize: '1.1rem', 
                                    fontWeight: '800',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    backgroundColor: 'var(--bg-body)',
                                    border: '1px solid var(--border-light)',
                                    color: 'var(--text-primary)',
                                    width: '100%'
                                }}
                            />
                        </div>
                        <div>
                            <label className="form-label" style={{ fontWeight: '750', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                <TrendingDown size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Gastos (€)
                            </label>
                            <input
                                type="number" step="0.01"
                                value={dailyExpense} onChange={e => setDailyExpense(e.target.value)}
                                placeholder="0.00"
                                style={{ 
                                    fontSize: '1.1rem', 
                                    fontWeight: '800',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    backgroundColor: 'var(--bg-body)',
                                    border: '1px solid var(--border-light)',
                                    color: 'var(--danger)',
                                    width: '100%'
                                }}
                            />
                        </div>
                    </div>

                    {/* Resumen Final Card */}
                    <div style={{ 
                        background: 'linear-gradient(135deg, var(--bg-body) 0%, var(--bg-card) 100%)', 
                        borderRadius: '20px', 
                        padding: '1.25rem',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ padding: '6px', background: 'rgba(var(--success-rgb), 0.1)', borderRadius: '8px' }}>
                                    <TrendingUp size={16} color="var(--success)" />
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Ingreso Total</span>
                            </div>
                            <span style={{ fontWeight: '850', fontSize: '1rem' }}>{totalIncome.toFixed(2)} €</span>
                        </div>

                        <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ padding: '6px', background: 'rgba(var(--accent-primary-rgb), 0.1)', borderRadius: '8px' }}>
                                    <Wallet size={16} color="var(--accent-primary)" />
                                </div>
                                <span style={{ fontSize: '0.9rem', fontWeight: '850', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>BENEFICIO NETO</span>
                            </div>
                            <span style={{ 
                                fontWeight: '900', 
                                fontSize: '1.5rem', 
                                color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)',
                                letterSpacing: '-0.02em'
                            }}>
                                {netProfit.toFixed(2)}<span style={{ fontSize: '1rem', marginLeft: '2px' }}>€</span>
                            </span>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={isPending}
                        style={{ 
                            height: '56px',
                            borderRadius: '16px',
                            fontWeight: '850',
                            fontSize: '1rem',
                            boxShadow: '0 8px 24px rgba(var(--accent-primary-rgb), 0.20)'
                        }}
                    >
                        {isPending ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        <span style={{ marginLeft: '12px' }}>
                            {isPending ? 'Guardando...' : (todayMileage || todayServiceSmart ? 'Actualizar Resumen' : 'Guardar Resumen')}
                        </span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DailyTotalForm;
