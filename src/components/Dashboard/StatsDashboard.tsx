import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateTotals, Period } from '../../utils/financeHelpers';

const StatsDashboard: React.FC = () => {
    const { services, expenses, mileageLogs } = useApp();
    const [period, setPeriod] = useState<Period>('day');

    const now = new Date();
    const { grossIncome, totalExpenses, netIncome, totalKms } = calculateTotals(services, expenses, mileageLogs, period, now);

    const formatCurr = (val: number) => val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

    return (
        <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '4px' }}>
                {['day', 'week', 'month', 'year'].map(p => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p as Period)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            color: period === p ? 'var(--text-primary)' : 'var(--text-muted)',
                            background: period === p ? 'var(--bg-card)' : 'transparent',
                            boxShadow: period === p ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                            fontWeight: period === p ? '700' : '500',
                            flex: 1
                        }}
                    >
                        {p === 'day' ? 'Hoy' : p === 'week' ? 'Sem' : p === 'month' ? 'Mes' : 'Año'}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Bruto</div>
                    <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--success)' }}>{formatCurr(grossIncome)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Gastos</div>
                    <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--danger)' }}>{formatCurr(totalExpenses)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Neto</div>
                    <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--accent-primary)' }}>{formatCurr(netIncome)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Dist.</div>
                    <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)' }}>{totalKms.toLocaleString()} <span style={{ fontSize: '0.6rem', fontWeight: '400' }}>km</span></div>
                </div>
            </div>
        </div>
    );
};

export default StatsDashboard;
