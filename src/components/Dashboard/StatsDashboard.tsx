import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateTotals, Period } from '../../utils/financeHelpers';

const StatsDashboard: React.FC = () => {
    const { services, expenses, mileageLogs } = useApp();
    const [period, setPeriod] = useState<Period>('day');
    const [viewMode, setViewMode] = useState<'total' | 'taxi' | 'company'>('total');

    const now = new Date();
    const totals = calculateTotals(services, expenses, mileageLogs, period, now);

    // Dynamic metrics based on viewMode
    const displayGross = viewMode === 'total' ? totals.grossIncome :
        viewMode === 'taxi' ? totals.taxiIncome : totals.subscriberIncome;

    // Expenses are usually general, but we can show them in total/taxi view
    const displayExpenses = viewMode === 'company' ? 0 : totals.totalExpenses;
    const displayNet = displayGross - displayExpenses;
    const displayKms = viewMode === 'company' ? 0 : totals.totalKms;

    const formatCurr = (val: number) => val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

    const getTabColor = (mode: string) => {
        if (viewMode !== mode) return 'var(--text-muted)';
        switch (mode) {
            case 'taxi': return 'var(--accent-primary)';
            case 'company': return '#8b5cf6'; // Violet/Indigo for subscribers
            default: return 'var(--text-primary)';
        }
    };

    return (
        <div className="card" style={{ padding: '1.25rem' }}>
            {/* View Mode Tabs (Highest Level) */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {[
                    { id: 'total', label: 'Todo', icon: '📊' },
                    { id: 'taxi', label: 'Taxi', icon: '🚖' },
                    { id: 'company', label: 'Abonados', icon: '🏢' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setViewMode(tab.id as any)}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            border: 'none',
                            background: viewMode === tab.id ? 'var(--bg-secondary)' : 'transparent',
                            color: getTabColor(tab.id),
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                        }}
                    >
                        <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Period Selector */}
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
                            flex: 1,
                            cursor: 'pointer'
                        }}
                    >
                        {p === 'day' ? 'Hoy' : p === 'week' ? 'Sem' : p === 'month' ? 'Mes' : 'Año'}
                    </button>
                ))}
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Bruto</div>
                    <div style={{ fontWeight: '800', fontSize: '1rem', color: viewMode === 'company' ? '#8b5cf6' : 'var(--success)' }}>{formatCurr(displayGross)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Gastos</div>
                    <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--danger)' }}>{formatCurr(displayExpenses)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Neto</div>
                    <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--accent-primary)' }}>{formatCurr(displayNet)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Dist.</div>
                    <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)' }}>{displayKms.toLocaleString()} <span style={{ fontSize: '0.6rem', fontWeight: '400' }}>km</span></div>
                </div>
            </div>
        </div>
    );
};

export default StatsDashboard;
