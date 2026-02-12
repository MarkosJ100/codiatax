import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { format } from '../utils/dateHelpers';
import { CheckCircle2, XCircle, Search, Building2, Wallet } from 'lucide-react';
import { Service } from '../types';

const Billing: React.FC = () => {
    const { services, subscribers, updateService } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [showPaid, setShowPaid] = useState(false);

    // Filter company services
    const companyServices = useMemo(() => {
        let filtered = services.filter(s => s.type === 'company');

        if (!showPaid) {
            filtered = filtered.filter(s => !s.isPaid);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(s =>
                s.companyName?.toLowerCase().includes(term) ||
                s.observation?.toLowerCase().includes(term) ||
                format(new Date(s.timestamp), 'dd/MM/yyyy').includes(term)
            );
        }

        return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [services, searchTerm, showPaid]);

    // Group by subscriber
    const groupedServices = useMemo(() => {
        const groups: { [key: string]: { subscriber: any, services: Service[], totalPending: number, totalPaid: number } } = {};

        companyServices.forEach(service => {
            const subId = service.subscriberId || 'unknown';
            if (!groups[subId]) {
                const sub = subscribers.find(s => s.id === subId);
                groups[subId] = {
                    subscriber: sub || { name: service.companyName || 'Desconocido', officeNumber: '-' },
                    services: [],
                    totalPending: 0,
                    totalPaid: 0
                };
            }
            groups[subId].services.push(service);
            if (service.isPaid) {
                groups[subId].totalPaid += service.amount;
            } else {
                groups[subId].totalPending += service.amount;
            }
        });

        // Filter groups based on search (if search matches subscriber name/office)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return Object.values(groups).filter(g =>
                g.subscriber.name.toLowerCase().includes(term) ||
                (g.subscriber.officeNumber && g.subscriber.officeNumber.toLowerCase().includes(term)) ||
                g.services.length > 0 // Keep if services matched the filter above
            );
        }

        return Object.values(groups);
    }, [companyServices, subscribers, searchTerm]);

    const globalPending = useMemo(() => {
        return services
            .filter(s => s.type === 'company' && !s.isPaid)
            .reduce((sum, s) => sum + s.amount, 0);
    }, [services]);

    const togglePaidStatus = (service: Service) => {
        updateService(service.id, { isPaid: !service.isPaid });
    };

    return (
        <div className="page-container" style={{ paddingBottom: '80px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 className="text-2xl font-bold" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6' }}>
                    <Wallet size={24} /> Facturación de Abonados
                </h2>
                <div className="card" style={{
                    marginTop: '1rem',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
                    border: '1px solid #8b5cf6'
                }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Pendiente de Cobro</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                        {globalPending.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar abonado, despacho..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '40px', width: '100%' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="checkbox"
                        id="showPaid"
                        checked={showPaid}
                        onChange={(e) => setShowPaid(e.target.checked)}
                        style={{ width: 'auto' }}
                    />
                    <label htmlFor="showPaid" style={{ fontSize: '0.9rem', userSelect: 'none' }}>Mostrar pagados</label>
                </div>
            </div>

            {/* Services List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {groupedServices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No hay servicios pendientes registrados.
                    </div>
                ) : (
                    groupedServices.map((group, index) => (
                        <div key={index} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                <div>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                                        <Building2 size={18} />
                                        {group.subscriber.name}
                                    </h3>
                                    {group.subscriber.officeNumber && (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            Despacho: <strong>{group.subscriber.officeNumber}</strong>
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pendiente</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: group.totalPending > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                        {group.totalPending.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {group.services.map(service => (
                                    <div key={service.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px',
                                        opacity: service.isPaid ? 0.6 : 1
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                {format(new Date(service.timestamp), 'dd/MM/yyyy HH:mm')}
                                            </div>
                                            {service.observation && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                    {service.observation}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ fontWeight: 'bold' }}>
                                                {service.amount.toFixed(2)}€
                                            </div>
                                            <button
                                                onClick={() => togglePaidStatus(service)}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: service.isPaid ? 'var(--success)' : 'var(--text-muted)'
                                                }}
                                                title={service.isPaid ? "Marcar como pendiente" : "Marcar como pagado"}
                                            >
                                                {service.isPaid ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Billing;
