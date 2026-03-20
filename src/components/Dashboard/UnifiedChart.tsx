import React, { useMemo, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useServices } from '../../context/ServiceContext';
import { useVehicle } from '../../context/VehicleContext';
import { format, subDays, startOfWeek, startOfMonth, startOfYear, isSameDay } from '../../utils/dateHelpers';
import { TrendingUp, Gauge, ChevronLeft, ChevronRight } from 'lucide-react';

type ChartMetric = 'net' | 'income' | 'km' | 'finance';

const UnifiedChart: React.FC = () => {
    const { services, expenses } = useServices();
    const { mileageLogs } = useVehicle();
    const [metric, setMetric] = useState<ChartMetric>('net');
    const [days, setDays] = useState<7 | 14 | 30 | 180>(7);

    // Chart data
    const chartData = useMemo(() => {
        const data = [];
        const today = new Date();

        // 1. Group data by day for O(1) lookup
        const servicesByDay = new Map<string, any[]>();
        const expensesByDay = new Map<string, any[]>();
        const mileageByDay = new Map<string, number>();

        services.forEach(s => {
            const dateKey = format(new Date(s.timestamp), 'yyyy-MM-dd');
            if (!servicesByDay.has(dateKey)) servicesByDay.set(dateKey, []);
            servicesByDay.get(dateKey)!.push(s);
        });

        expenses.forEach(e => {
            const dateKey = format(new Date(e.timestamp), 'yyyy-MM-dd');
            if (!expensesByDay.has(dateKey)) expensesByDay.set(dateKey, []);
            expensesByDay.get(dateKey)!.push(e);
        });

        mileageLogs.forEach(log => {
            if (!log.timestamp) return;
            const dateKey = format(new Date(log.timestamp), 'yyyy-MM-dd');
            mileageByDay.set(dateKey, (mileageByDay.get(dateKey) || 0) + (Number(log.amount) || 0));
        });

        // 2. Generate chart points using O(1) lookups
        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(today, i);
            const dateKey = format(date, 'yyyy-MM-dd');

            const dayServices = servicesByDay.get(dateKey) || [];
            const dayExpenses = expensesByDay.get(dateKey) || [];
            const dayKm = mileageByDay.get(dateKey) || 0;

            const income = dayServices.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
            const allExpenses = dayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

            data.push({
                date: days <= 7 ? format(date, 'EEE') : days <= 30 ? format(date, 'dd/MM') : format(date, 'MMM'),
                value: metric === 'net' ? income - allExpenses : metric === 'income' ? income : metric === 'finance' ? income - allExpenses : dayKm,
                income,
                expenses: allExpenses,
                net: income - allExpenses
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

    const getColor = (m: ChartMetric = metric) => {
        switch (m) {
            case 'net': return 'var(--accent-primary)';
            case 'income': return 'var(--success)';
            case 'km': return 'var(--accent-secondary, #8b5cf6)';
            case 'finance': return 'var(--accent-primary)';
            default: return 'var(--accent-primary)';
        }
    };

    const getLabel = () => {
        switch (metric) {
            case 'net': return 'Beneficio Neto';
            case 'income': return 'Ingresos';
            case 'km': return 'Kilómetros';
            case 'finance': return 'Finanzas Globales';
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
                    {(['finance', 'net', 'income', 'km'] as ChartMetric[]).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMetric(m)}
                            style={{
                                padding: '6px 12px',
                                fontSize: '0.7rem',
                                borderRadius: '999px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: metric === m ? getColor(m) : 'var(--bg-secondary)',
                                color: metric === m ? 'var(--bg-card)' : 'var(--text-muted)',
                                fontWeight: metric === m ? '600' : '400',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            <span>{m === 'finance' ? '📊' : m === 'net' ? '💰' : m === 'income' ? '📈' : '🚗'}</span>
                            {metric === m && <span style={{ fontSize: '0.6rem' }}>{m === 'finance' ? 'Todo' : ''}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Area Chart */}
            <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
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
                        formatter={(value: number | undefined, name: string | undefined) => {
                            const val = value ?? 0;
                            const nm = name ?? '';
                            const formatted = val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 });
                            const label = nm === 'net' ? 'Beneficio' : nm === 'income' ? 'Bruto' : nm === 'expenses' ? 'Gastos' : getLabel();
                            return [formatted, label];
                        }}
                        labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    {metric === 'finance' ? (
                        <>
                            <Area
                                type="monotone"
                                dataKey="income"
                                stroke="var(--success)"
                                strokeWidth={2}
                                fill="url(#colorIncome)"
                                name="income"
                            />
                            <Area
                                type="monotone"
                                dataKey="expenses"
                                stroke="var(--danger)"
                                strokeWidth={2}
                                fill="url(#colorExpenses)"
                                name="expenses"
                            />
                            <Area
                                type="monotone"
                                dataKey="net"
                                stroke="var(--accent-primary)"
                                strokeWidth={3}
                                fill="url(#colorNet)"
                                name="net"
                            />
                        </>
                    ) : (
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={getColor()}
                            strokeWidth={2}
                            fill="url(#colorNet)"
                        />
                    )}
                </AreaChart>
            </ResponsiveContainer>

            {/* Days selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '0.75rem' }}>
                {([7, 14, 30, 180] as const).map((d) => (
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
                        {d === 180 ? '6 meses' : `${d}d`}
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

export default React.memo(UnifiedChart);
