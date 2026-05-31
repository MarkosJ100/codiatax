import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Users, MapPin, Wallet, Calculator,
    Calendar, CheckCircle2, ChevronDown, ListFilter
} from 'lucide-react';
import { useServices } from '../../context/ServiceContext';
import { useVehicle } from '../../context/VehicleContext';
import {
    format, subMonths, es
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
            value: `${stats.grossIncome.toFixed(0)} €`,
            icon: <TrendingUp size={18} />,
            color: 'var(--success)',
            bg: 'rgba(var(--success-rgb), 0.1)'
        },
        {
            label: 'Abonados',
            value: `${stats.subscriberIncome.toFixed(0)} €`,
            icon: <Users size={18} />,
            color: 'var(--accent-strong)',
            bg: 'var(--accent-soft)'
        },
        {
            label: `KMs${stats.isKmsEstimated ? '*' : ''}`,
            value: `${stats.totalKms.toFixed(0)}`,
            icon: <MapPin size={18} />,
            color: 'var(--text-primary)',
            bg: 'var(--bg-secondary)'
        },
        {
            label: `Gastos${stats.isExpensesEstimated ? '*' : ''}`,
            value: `${stats.totalExpenses.toFixed(0)} €`,
            icon: <Wallet size={18} />,
            color: 'var(--danger)',
            bg: 'rgba(var(--danger-rgb), 0.1)'
        },
        {
            label: 'Neto',
            value: `${stats.netIncome.toFixed(0)} €`,
            icon: <Calculator size={18} />,
            color: 'var(--accent-primary)',
            bg: 'var(--accent-soft)'
        },
        {
            label: 'Servicios',
            value: stats.servicesCount,
            icon: <ListFilter size={18} />,
            color: 'var(--text-muted)',
            bg: 'rgba(127,127,127,0.1)'
        }
    ];

    return (
        <motion.div
            layout
            initial={false}
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
                background: 'var(--bg-card)',
                borderRadius: '24px',
                padding: '1.25rem',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-premium)',
                marginBottom: '1rem',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.2s ease'
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border-light)'
                    }}>
                        <Calendar size={20} color="var(--text-muted)" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '850', letterSpacing: '0.1em', marginBottom: '2px' }}>
                            CIERRE ANTERIOR
                        </div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '950', color: 'var(--text-primary)', textTransform: 'capitalize', letterSpacing: '-0.02em' }}>
                            {monthName} {year}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!isExpanded && (
                        <div style={{ fontSize: '1.1rem', fontWeight: '950', color: 'var(--success)', letterSpacing: '-0.02em' }}>
                            +{stats.netIncome.toFixed(0)} €
                        </div>
                    )}
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown size={20} color="var(--text-muted)" />
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '10px',
                            marginTop: '1.5rem'
                        }}>
                            {summaryItems.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.04 }}
                                    style={{
                                        background: 'var(--bg-elevated)',
                                        padding: '1rem',
                                        borderRadius: '18px',
                                        border: '1px solid var(--border-light)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px',
                                        boxShadow: 'var(--shadow-premium)'
                                    }}
                                >
                                    <div style={{
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '10px',
                                        background: item.bg,
                                        color: item.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                                            {item.label}
                                        </div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                                            {item.value}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div style={{
                            marginTop: '1.25rem',
                            padding: '12px 16px',
                            background: 'var(--accent-soft)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            border: '1px solid rgba(var(--accent-primary-rgb), 0.1)'
                        }}>
                            <CheckCircle2 size={16} color="var(--accent-strong)" />
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                                Informe mensual listo.
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default React.memo(MonthlySummaryCard);
