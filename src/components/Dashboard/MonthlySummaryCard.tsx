import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Users, MapPin, Wallet, Calculator,
    Calendar, CheckCircle2, ChevronDown, ListFilter
} from 'lucide-react';
import { useServices } from '../../context/ServiceContext';
import { useVehicle } from '../../context/VehicleContext';
import {
    format, subMonths, startOfMonth, endOfMonth, es
} from '../../utils/dateHelpers';
import { calculateTotals } from '../../utils/financeHelpers';

const MonthlySummaryCard: React.FC = () => {
    const { services, expenses } = useServices();
    const { mileageLogs } = useVehicle();
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate metrics for the previous month
    const {
        stats, monthName, year
    } = useMemo(() => {
        const lastMonth = subMonths(new Date(), 1);

        const totals = calculateTotals(services, expenses, mileageLogs, 'month', lastMonth);

        return {
            stats: totals,
            monthName: format(lastMonth, 'MMMM', { locale: es }),
            year: lastMonth.getFullYear()
        };
    }, [services, expenses, mileageLogs]);

    if (stats.servicesCount === 0) return null;

    const summaryItems = [
        {
            label: 'Importe Bruto',
            value: `${stats.grossIncome.toFixed(2)}€`,
            icon: <TrendingUp size={20} />,
            color: 'var(--success)',
            bg: 'rgba(34, 197, 94, 0.1)'
        },
        {
            label: 'Abonados',
            value: `${stats.subscriberIncome.toFixed(2)}€`,
            icon: <Users size={20} />,
            color: 'var(--accent-secondary, #8b5cf6)',
            bg: 'rgba(139, 92, 246, 0.1)'
        },
        {
            label: `Kilómetros${stats.isKmsEstimated ? ' (aprox.)' : ''}`,
            value: `${stats.totalKms.toFixed(2)} km`,
            icon: <MapPin size={20} />,
            color: 'var(--warning)',
            bg: 'rgba(234, 179, 8, 0.1)'
        },
        {
            label: `Gastos${stats.isExpensesEstimated ? ' (aprox.)' : ''}`,
            value: `${stats.totalExpenses.toFixed(2)}€`,
            icon: <Wallet size={20} />,
            color: 'var(--danger)',
            bg: 'rgba(239, 68, 68, 0.1)'
        },
        {
            label: 'Neto',
            value: `${stats.netIncome.toFixed(2)}€`,
            icon: <Calculator size={20} />,
            color: 'var(--accent-primary)',
            bg: 'rgba(59, 130, 246, 0.1)'
        },
        {
            label: 'Servicios',
            value: stats.servicesCount,
            icon: <ListFilter size={20} />,
            color: 'var(--text-secondary)',
            bg: 'rgba(107, 114, 128, 0.1)'
        },
        {
            label: 'Días Trab.',
            value: stats.daysWorked,
            icon: <Calendar size={20} />,
            color: 'var(--info, #3b82f6)',
            bg: 'rgba(59, 130, 246, 0.1)'
        }
    ];

    return (
        <motion.div
            layout
            initial={false}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
                background: 'var(--bg-card)',
                borderRadius: '24px',
                padding: '1.25rem',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-premium)',
                marginBottom: '1rem',
                cursor: 'pointer',
                overflow: 'hidden'
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: isExpanded ? '1.5rem' : '0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'rgba(var(--accent-primary-rgb), 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-primary)'
                    }}>
                        <Calendar size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                            Resumen Mensual
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                            {monthName} {year}
                        </div>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown size={20} color="var(--text-muted)" />
                </motion.div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '12px'
                        }}>
                            {summaryItems.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        padding: '1rem',
                                        borderRadius: '16px',
                                        border: '1px solid var(--border-light)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: item.bg,
                                        color: item.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                                            {item.label}
                                        </div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                            {item.value}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div style={{
                            marginTop: '1.5rem',
                            padding: '12px',
                            background: 'rgba(var(--accent-primary-rgb), 0.05)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            border: '1px solid rgba(var(--accent-primary-rgb), 0.1)'
                        }}>
                            <CheckCircle2 size={16} color="var(--accent-primary)" />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                Resumen generado automáticamente al finalizar el mes.
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default React.memo(MonthlySummaryCard);
