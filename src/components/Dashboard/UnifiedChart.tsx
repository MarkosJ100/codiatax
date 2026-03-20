import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useServices } from '../../context/ServiceContext';
import { useVehicle } from '../../context/VehicleContext';
import { format, subDays, startOfWeek, startOfMonth, startOfYear, isSameDay } from '../../utils/dateHelpers';
import { TrendingUp, Gauge, Calendar, Activity, BarChart3, Car, DollarSign } from 'lucide-react';

type ChartMetric = 'net' | 'income' | 'km' | 'finance';

const UnifiedChart: React.FC = () => {
    const { services, expenses } = useServices();
    const { mileageLogs } = useVehicle();
    const [metric, setMetric] = useState<ChartMetric>('finance');
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
                net: income - allExpenses,
                km: dayKm
            });
        }

        return data;
    }, [services, expenses, mileageLogs, days, metric]);

    // Totals for the selected period
    const total = useMemo(() => {
        return chartData.reduce((sum, d) => sum + (metric === 'km' ? d.km : metric === 'income' ? d.income : metric === 'net' ? d.net : d.net), 0);
    }, [chartData, metric]);

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
            case 'income': return 'Ingresos Brutos';
            case 'km': return 'Kilómetros';
            case 'finance': return 'Balance Global';
        }
    };

    const formatValue = (val: number) => {
        if (metric === 'km') return `${val.toLocaleString()} km`;
        return val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 });
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Header with metric selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
                <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '850', letterSpacing: '0.1em', marginBottom: '4px' }}>
                        {getLabel()} <span style={{ opacity: 0.5 }}>• {days}D</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
                        {formatValue(total)}
                    </div>
                </div>
                
                <div 
                    className="segmented-control" 
                    style={{ 
                        maxWidth: '180px', 
                        padding: '3px', 
                        borderRadius: '14px', 
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)'
                    }}
                >
                    <button 
                        onClick={() => setMetric('finance')} 
                        className={metric === 'finance' ? 'active' : ''} 
                        style={{ padding: '6px', borderRadius: '10px' }}
                        title="Balance Global"
                    >
                        <BarChart3 size={16} />
                    </button>
                    <button 
                        onClick={() => setMetric('income')} 
                        className={metric === 'income' ? 'active' : ''} 
                        style={{ padding: '6px', borderRadius: '10px' }}
                        title="Ingresos"
                    >
                        <TrendingUp size={16} />
                    </button>
                    <button 
                        onClick={() => setMetric('net')} 
                        className={metric === 'net' ? 'active' : ''} 
                        style={{ padding: '6px', borderRadius: '10px' }}
                        title="Beneficio"
                    >
                        <DollarSign size={16} />
                    </button>
                    <button 
                        onClick={() => setMetric('km')} 
                        className={metric === 'km' ? 'active' : ''} 
                        style={{ padding: '6px', borderRadius: '10px' }}
                        title="Kilómetros"
                    >
                        <Car size={16} />
                    </button>
                </div>
            </div>

            {/* Area Chart */}
            <div style={{ height: '220px', width: '100%', marginTop: '0.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--success)" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--accent-secondary, #8b5cf6)" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="var(--accent-secondary, #8b5cf6)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="var(--text-muted)"
                            style={{ fontSize: '0.65rem', fontWeight: '700' }}
                            tick={{ fill: 'var(--text-muted)' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip
                            cursor={{ stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '4 4' }}
                            contentStyle={{
                                backgroundColor: 'var(--bg-elevated)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '14px',
                                boxShadow: 'var(--shadow-premium)',
                                padding: '10px 14px',
                                fontSize: '0.8rem'
                            }}
                            itemStyle={{ padding: '2px 0', fontSize: '0.75rem', fontWeight: '800' }}
                            labelStyle={{ color: 'var(--text-primary)', marginBottom: '6px', fontWeight: '900', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}
                            formatter={(value: number | undefined, name: string | undefined) => {
                                const safeValue = value ?? 0;
                                const safeName = name ?? 'value';
                                const formatted = metric === 'km' && name === 'value'
                                    ? `${safeValue.toLocaleString()} km`
                                    : safeValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 });
                                
                                const label = safeName === 'net' ? 'Beneficio N.' : safeName === 'income' ? 'Ingreso Bruto' : safeName === 'expenses' ? 'Gastos' : safeName === 'km' ? 'Kilómetros' : getLabel();
                                return [formatted, label];
                            }}
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
                                    animationDuration={1000}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expenses"
                                    stroke="var(--danger)"
                                    strokeWidth={2}
                                    fill="url(#colorExpenses)"
                                    name="expenses"
                                    animationDuration={1200}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="net"
                                    stroke="var(--accent-primary)"
                                    strokeWidth={3}
                                    fill="url(#colorNet)"
                                    name="net"
                                    animationDuration={1500}
                                />
                            </>
                        ) : (
                            <Area
                                type="monotone"
                                dataKey={metric === 'km' ? 'km' : 'value'}
                                stroke={getColor()}
                                strokeWidth={3}
                                fill={metric === 'km' ? "url(#colorKm)" : "url(#colorNet)"}
                                animationDuration={1000}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Days selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '1.5rem' }}>
                <div 
                    className="segmented-control" 
                    style={{ 
                        width: 'auto', 
                        padding: '3px', 
                        background: 'var(--bg-secondary)', 
                        borderRadius: '12px' 
                    }}
                >
                    {([7, 14, 30, 180] as const).map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={days === d ? 'active' : ''}
                            style={{
                                padding: '5px 12px',
                                fontSize: '0.7rem',
                                borderRadius: '10px',
                                fontWeight: '800'
                            }}
                        >
                            {d === 180 ? '6M' : `${d}D`}
                        </button>
                    ))}
                </div>
            </div>

            {/* KM Quick Stats (only when km is selected) */}
            {metric === 'km' && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '8px',
                        marginTop: '1.25rem',
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-light)'
                    }}
                >
                    {[
                        { label: 'Hoy', value: kmStats.daily, color: 'var(--accent-primary)' },
                        { label: 'Sem.', value: kmStats.weekly, color: 'var(--success)' },
                        { label: 'Mes', value: kmStats.monthly, color: '#3b82f6' },
                        { label: 'Año', value: kmStats.annual, color: '#a855f7' }
                    ].map(stat => (
                        <div key={stat.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '850', letterSpacing: '0.05em', marginBottom: '2px' }}>{stat.label}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '950', color: stat.color, letterSpacing: '-0.02em' }}>{stat.value.toLocaleString()}</div>
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default React.memo(UnifiedChart);
