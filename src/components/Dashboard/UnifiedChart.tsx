import React, { useMemo, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useServices } from '../../context/ServiceContext';
import { useVehicle } from '../../context/VehicleContext';
import { format, subDays, startOfWeek, startOfMonth, startOfYear, isSameDay } from '../../utils/dateHelpers';
import { TrendingUp, Gauge, ChevronLeft, ChevronRight } from 'lucide-react';

type ChartMetric = 'net' | 'income' | 'km';

const UnifiedChart: React.FC = () => {
    const { services, expenses } = useServices();
    const { mileageLogs } = useVehicle();
    const [metric, setMetric] = useState<ChartMetric>('net');
    const [days, setDays] = useState<7 | 14 | 30>(7);

    // Chart data
    const chartData = useMemo(() => {
        const data = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(today, i);

            const dayServices = services.filter(s => isSameDay(new Date(s.timestamp), date));
            const dayExpenses = expenses.filter(e => isSameDay(new Date(e.timestamp), date));
            const dayKm = mileageLogs
                .filter(log => log.timestamp && isSameDay(new Date(log.timestamp), date))
                .reduce((sum, log) => sum + (Number(log.amount) || 0), 0);

            const income = dayServices.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
            const allExpenses = dayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

            data.push({
                date: format(date, days === 7 ? 'EEE' : 'dd/MM'),
                value: metric === 'net' ? income - allExpenses : metric === 'income' ? income : dayKm
            });
        }

        return data;
    }, [services, expenses, mileageLogs, days, metric]);

    // Totals for the selected period
    const total = useMemo(() => {
        return chartData.reduce((sum, d) => sum + d.value, 0);
    }, [chartData]);

    // KM Stats for quick view
    const kmStats = useMemo(() => {
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const monthStart = startOfMonth(today);
        const yearStart = startOfYear(today);

        return {
            daily: mileageLogs.filter(log => log.timestamp && isSameDay(new Date(log.timestamp), today)).reduce((s, l) => s + (l.amount || 0), 0),
            weekly: mileageLogs.filter(log => log.timestamp && new Date(log.timestamp) >= weekStart).reduce((s, l) => s + (l.amount || 0), 0),
            monthly: mileageLogs.filter(log => log.timestamp && new Date(log.timestamp) >= monthStart).reduce((s, l) => s + (l.amount || 0), 0),
            annual: mileageLogs.filter(log => log.timestamp && new Date(log.timestamp) >= yearStart).reduce((s, l) => s + (l.amount || 0), 0),
        };
    }, [mileageLogs]);

    const getColor = () => {
        switch (metric) {
            case 'net': return 'var(--accent-primary)';
            case 'income': return 'var(--success)';
            case 'km': return 'var(--accent-secondary, #8b5cf6)';
        }
    };

    const getLabel = () => {
        switch (metric) {
            case 'net': return 'Beneficio Neto';
            case 'income': return 'Ingresos';
            case 'km': return 'Kilómetros';
        }
    };

    const formatValue = (val: number) => {
        if (metric === 'km') return `${val.toLocaleString()} km`;
        return val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 });
    };

    return (
        <div className="card">
            {/* Header with metric selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        {getLabel()} ({days} días)
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getColor() }}>
                        {formatValue(total)}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {(['net', 'income', 'km'] as ChartMetric[]).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMetric(m)}
                            style={{
                                padding: '6px 12px',
                                fontSize: '0.7rem',
                                borderRadius: '999px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: metric === m ? getColor() : 'var(--bg-secondary)',
                                color: metric === m ? 'var(--bg-card)' : 'var(--text-muted)',
                                fontWeight: metric === m ? '600' : '400',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {m === 'net' ? '💰' : m === 'income' ? '📈' : '🚗'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Area Chart */}
            <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={getColor()} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={getColor()} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="var(--text-muted)"
                        style={{ fontSize: '0.6rem' }}
                        tick={{ fill: 'var(--text-muted)' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.8rem'
                        }}
                        formatter={(value: number | undefined) => [formatValue(value ?? 0), getLabel()]}
                        labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={getColor()}
                        strokeWidth={2}
                        fill="url(#colorGradient)"
                    />
                </AreaChart>
            </ResponsiveContainer>

            {/* Days selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '0.75rem' }}>
                {([7, 14, 30] as const).map((d) => (
                    <button
                        key={d}
                        onClick={() => setDays(d)}
                        style={{
                            padding: '4px 10px',
                            fontSize: '0.65rem',
                            borderRadius: '6px',
                            border: days === d ? 'none' : '1px solid var(--border-light)',
                            cursor: 'pointer',
                            backgroundColor: days === d ? 'var(--accent-glow)' : 'transparent',
                            color: days === d ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontWeight: days === d ? '600' : '400'
                        }}
                    >
                        {d}d
                    </button>
                ))}
            </div>

            {/* KM Quick Stats (only when km is selected) */}
            {metric === 'km' && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-light)'
                }}>
                    {[
                        { label: 'Hoy', value: kmStats.daily, color: 'var(--accent-primary)' },
                        { label: 'Semana', value: kmStats.weekly, color: 'var(--success)' },
                        { label: 'Mes', value: 'var(--info, #3b82f6)' },
                        { label: 'Año', value: 'var(--accent-secondary, #8b5cf6)' }
                    ].map(stat => (
                        <div key={stat.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{stat.label}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: typeof stat.value === 'string' ? stat.value : stat.color }}>{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.label === 'Mes' ? kmStats.monthly.toLocaleString() : kmStats.annual.toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UnifiedChart;
