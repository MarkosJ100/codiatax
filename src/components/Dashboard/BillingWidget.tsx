import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';
import { Wallet, ChevronRight } from 'lucide-react';
import { isSameMonth } from '../../utils/dateHelpers';

const BillingWidget: React.FC = () => {
    const { services } = useApp();

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
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem', border: '1px solid var(--accent-primary)', background: 'linear-gradient(to right, rgba(59,130,246,0.05), transparent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wallet size={18} className="text-accent-primary" />
                    Estado Facturación
                </h3>
                <Link to="/billing" className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                    Ver Todo <ChevronRight size={14} />
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pendiente Total</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                        {totalPending.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
                    </div>
                    {currentMonthPending > 0 && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            ({currentMonthPending.toFixed(0)}€ este mes)
                        </div>
                    )}
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cobrado Total</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                        {totalPaid.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingWidget;
