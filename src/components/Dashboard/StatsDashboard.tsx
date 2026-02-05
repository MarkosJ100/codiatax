import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { isSameDay, isSameWeek, isSameMonth, isSameYear } from '../../utils/dateHelpers';
import { Coins, Gauge } from 'lucide-react';

const StatsDashboard: React.FC = () => {
    const { services, mileageLogs } = useApp();
    const [period, setPeriod] = useState<string>('day');

    const now = new Date();

    const filterByPeriod = (item: any, dateField: string) => {
        const d = new Date(item[dateField]);
        switch (period) {
            case 'day': return isSameDay(d, now);
            case 'week': return isSameWeek(d, now, { weekStartsOn: 1 });
            case 'month': return isSameMonth(d, now);
            case 'year': return isSameYear(d, now);
            default: return false;
        }
    };

    const income = services.filter(s => filterByPeriod(s, 'timestamp')).reduce((acc, curr) => acc + curr.amount, 0);
    const kms = mileageLogs.filter(l => filterByPeriod(l, 'timestamp')).reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                {['day', 'week', 'month', 'year'].map(p => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        style={{
                            color: period === p ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            fontWeight: period === p ? 'bold' : 'normal',
                            textTransform: 'capitalize',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {p === 'day' ? 'Día' : p === 'week' ? 'Sem' : p === 'month' ? 'Mes' : 'Año'}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px', color: 'var(--success)' }}>
                        <Coins size={16} style={{ marginRight: '6px' }} />
                        <span style={{ fontSize: '0.8rem' }}>Recaudación</span>
                    </div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {income.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        <Gauge size={16} style={{ marginRight: '6px' }} />
                        <span style={{ fontSize: '0.8rem' }}>Recorrido</span>
                    </div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {kms.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>km</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StatsDashboard;
