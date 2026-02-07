import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApp } from '../../context/AppContext';
import { format, subDays, startOfWeek, startOfMonth, startOfYear, isSameDay } from '../../utils/dateHelpers';
import { Gauge } from 'lucide-react';

const MileageChart: React.FC = () => {
    const { mileageLogs } = useApp();

    const stats = useMemo(() => {
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Lunes
        const monthStart = startOfMonth(today);
        const yearStart = startOfYear(today);

        const dailyKm = mileageLogs
            .filter(log => log.timestamp && isSameDay(new Date(log.timestamp), today))
            .reduce((sum, log) => sum + (log.amount || 0), 0);

        const weeklyKm = mileageLogs
            .filter(log => log.timestamp && new Date(log.timestamp) >= weekStart)
            .reduce((sum, log) => sum + (log.amount || 0), 0);

        const monthlyKm = mileageLogs
            .filter(log => log.timestamp && new Date(log.timestamp) >= monthStart)
            .reduce((sum, log) => sum + (log.amount || 0), 0);

        const annualKm = mileageLogs
            .filter(log => log.timestamp && new Date(log.timestamp) >= yearStart)
            .reduce((sum, log) => sum + (log.amount || 0), 0);

        return [
            { period: 'Hoy', km: dailyKm, color: 'var(--accent-primary)' },
            { period: 'Semana', km: weeklyKm, color: 'var(--success)' },
            { period: 'Mes', km: monthlyKm, color: '#3b82f6' },
            { period: 'Año', km: annualKm, color: '#8b5cf6' }
        ];
    }, [mileageLogs]);

    const chartData = useMemo(() => {
        const data = [];
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = subDays(today, i);
            const dateStr = format(date, 'yyyy-MM-dd');

            const dayKm = mileageLogs
                .filter(log => log.timestamp && isSameDay(new Date(log.timestamp), date))
                .reduce((sum, log) => sum + (log.amount || 0), 0);

            data.push({
                date: format(date, 'dd/MM'),
                fullDate: dateStr,
                'Kilómetros': dayKm
            });
        }

        return data;
    }, [mileageLogs]);

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Gauge size={20} color="var(--accent-primary)" />
                    Estadísticas de Kilómetros
                </h3>
            </div>

            {/* Resumen de Períodos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {stats.map((stat) => (
                    <div
                        key={stat.period}
                        style={{
                            textAlign: 'center',
                            padding: '0.75rem',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}
                    >
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
                            {stat.period}
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: stat.color, fontFamily: 'monospace' }}>
                            {stat.km.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>km</div>
                    </div>
                ))}
            </div>

            {/* Gráfica de Últimos 30 Días */}
            <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: '600' }}>
                    Últimos 30 Días
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="date"
                            stroke="var(--text-muted)"
                            style={{ fontSize: '0.65rem' }}
                            tick={{ fill: 'var(--text-muted)' }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            stroke="var(--text-muted)"
                            style={{ fontSize: '0.7rem' }}
                            tick={{ fill: 'var(--text-muted)' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                fontSize: '0.85rem'
                            }}
                            labelStyle={{ color: 'var(--text-primary)' }}
                        />
                        <Bar
                            dataKey="Kilómetros"
                            fill="var(--accent-primary)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MileageChart;
