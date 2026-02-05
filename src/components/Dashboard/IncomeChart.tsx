import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApp } from '../../context/AppContext';
import { format, subDays, isSameDay } from '../../utils/dateHelpers';
import { TrendingUp } from 'lucide-react';

interface IncomeChartProps {
    days?: number;
}

const IncomeChart: React.FC<IncomeChartProps> = ({ days = 30 }) => {
    const { services, expenses } = useApp();

    const chartData = useMemo(() => {
        const data = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(today, i);
            const dateStr = format(date, 'yyyy-MM-dd');

            const dayServices = services.filter(s =>
                isSameDay(new Date(s.timestamp), date)
            );

            const dayExpenses = expenses.filter(e =>
                e.type === 'labor' && isSameDay(new Date(e.timestamp), date)
            );

            const income = dayServices.reduce((sum, s) => sum + s.amount, 0);
            const laborExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
            const net = income - laborExpenses;

            data.push({
                date: format(date, 'dd/MM'),
                fullDate: dateStr,
                'Ingresos': parseFloat(income.toFixed(2)),
                'Gastos': parseFloat(laborExpenses.toFixed(2)),
                'Neto': parseFloat(net.toFixed(2))
            });
        }

        return data;
    }, [services, expenses, days]);

    const totals = useMemo(() => {
        return chartData.reduce((acc, day) => ({
            income: acc.income + day['Ingresos'],
            expenses: acc.expenses + day['Gastos'],
            net: acc.net + day['Neto']
        }), { income: 0, expenses: 0, net: 0 });
    }, [chartData]);

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={20} color="var(--accent-primary)" />
                    Evolución Últimos {days} Días
                </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Ingresos</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                        {totals.income.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Gastos</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                        {totals.expenses.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Neto</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        {totals.net.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="date"
                        stroke="var(--text-muted)"
                        style={{ fontSize: '0.7rem' }}
                        tick={{ fill: 'var(--text-muted)' }}
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
                    <Legend
                        wrapperStyle={{ fontSize: '0.8rem' }}
                        iconType="line"
                    />
                    <Line
                        type="monotone"
                        dataKey="Ingresos"
                        stroke="var(--success)"
                        strokeWidth={2}
                        dot={{ fill: 'var(--success)', r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="Gastos"
                        stroke="var(--danger)"
                        strokeWidth={2}
                        dot={{ fill: 'var(--danger)', r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="Neto"
                        stroke="var(--accent-primary)"
                        strokeWidth={2}
                        dot={{ fill: 'var(--accent-primary)', r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default IncomeChart;
