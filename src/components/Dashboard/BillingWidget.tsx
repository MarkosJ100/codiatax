import React, { useMemo } from 'react';
import { useServices } from '../../context/ServiceContext';
import { Link } from 'react-router-dom';
import { Wallet, ChevronRight } from 'lucide-react';
import { isSameMonth } from '../../utils/dateHelpers';

const BillingWidget: React.FC = () => {
    const { services } = useServices();

    const { totalPending, totalPaid, currentMonthPending } = useMemo(() => {
        let pending = 0;
        let paid = 0;
        let currentPending = 0;
        const now = new Date();

        services.forEach(s => {
            if (s.type === 'company') {
                if (s.isPaid) {
                    paid += s.amount;
                } else {
                    pending += s.amount;
                    if (isSameMonth(new Date(s.timestamp), now)) {
                        currentPending += s.amount;
                    }
                }
            }
        });

        return { totalPending: pending, totalPaid: paid, currentMonthPending: currentPending };
    }, [services]);

    if (totalPending === 0 && totalPaid === 0) return null;

    return (
        <div 
            className="glass" 
            style={{ 
                padding: '1.25rem', 
                borderRadius: '20px', 
                border: '1px solid var(--border-light)',
                background: 'var(--bg-secondary)',
                marginTop: '1.5rem'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: '850', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--accent-soft)', display: 'flex' }}>
                        <Wallet size={16} color="var(--accent-strong)" />
                    </div>
                    Estado de facturación
                </h3>
                <Link 
                    to="/billing" 
                    style={{ 
                        fontSize: '0.78rem', 
                        fontWeight: '700', 
                        color: 'var(--accent-strong)', 
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                >
                    Detalles <ChevronRight size={14} />
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-premium)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.04em', marginBottom: '8px' }}>Pendiente</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '950', color: 'var(--danger)', letterSpacing: '-0.02em' }}>
                        {totalPending.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
                    </div>
                    {currentMonthPending > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>
                            {currentMonthPending.toFixed(0)} EUR este mes
                        </div>
                    )}
                </div>

                <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-premium)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.04em', marginBottom: '8px' }}>Cobrado</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '950', color: 'var(--success)', letterSpacing: '-0.02em' }}>
                        {totalPaid.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: 0, marginTop: '4px' }}>-</div>
                </div>
            </div>
        </div>
    );
};

export default BillingWidget;

