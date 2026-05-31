import React, { useState, useMemo } from 'react';
import { useServices } from '../context/ServiceContext';
import { format, es } from '../utils/dateHelpers';
import { CheckCircle2, XCircle, Search, Building2, Wallet, Clock, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Service } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const Billing: React.FC = () => {
    const { services, subscribers, updateService } = useServices();
    const [searchTerm, setSearchTerm] = useState('');
    const [showPaid, setShowPaid] = useState(false);
    const [expandedSubs, setExpandedSubs] = useState<Record<string, boolean>>({});

    const toggleSub = (id: string) => {
        setExpandedSubs(prev => ({ ...prev, [id]: !prev[id] }));
    };

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

        const results = Object.values(groups);

        // Sort by pending amount desc
        return results.sort((a, b) => b.totalPending - a.totalPending);
    }, [companyServices, subscribers]);

    const globalPending = useMemo(() => {
        return services
            .filter(s => s.type === 'company' && !s.isPaid)
            .reduce((sum, s) => sum + s.amount, 0);
    }, [services]);

    const togglePaidStatus = (e: React.MouseEvent, service: Service) => {
        e.stopPropagation();
        updateService(service.id, { isPaid: !service.isPaid });
    };

    const inputStyle = {
        width: '100%',
        padding: '0.85rem 1rem',
        paddingLeft: '2.75rem',
        borderRadius: '16px',
        backgroundColor: 'var(--bg-input)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-light)',
        transition: 'all 0.2s',
        fontSize: '0.95rem',
        fontWeight: '500'
    };

    return (
        <div style={{ paddingBottom: '100px', maxWidth: '600px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '950', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Facturación</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Gestión de cobros pendientes de abonados</p>
            </div>

            {/* Hero Card */}
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, #7c3aed 100%)',
                    borderRadius: '28px',
                    padding: '1.75rem',
                    marginBottom: '1.5rem',
                    color: 'white',
                    boxShadow: '0 12px 24px -10px rgba(139, 92, 246, 0.4)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '850', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total Pendiente</div>
                    <div style={{ fontSize: '2.25rem', fontWeight: '950', letterSpacing: '-0.03em' }}>
                        {globalPending.toLocaleString('es-ES', { minimumFractionDigits: 2 })}<span style={{ fontSize: '1.25rem', marginLeft: '3px', opacity: 0.8 }}>€</span>
                    </div>
                    <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '700' }}>
                        <Wallet size={14} />
                        {groupedServices.length} Abonados con facturas
                    </div>
                </div>
                <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1 }}>
                    <Building2 size={120} />
                </div>
            </motion.div>

            {/* Search & Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar abonado, despacho o fecha..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={inputStyle as any}
                    />
                </div>
                
                <div 
                    onClick={() => setShowPaid(!showPaid)}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        padding: '10px 16px', 
                        background: 'var(--bg-card)', 
                        borderRadius: '14px', 
                        border: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        borderRadius: '6px', 
                        border: `2px solid ${showPaid ? 'var(--accent-primary)' : 'var(--border-dim)'}`,
                        background: showPaid ? 'var(--accent-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {showPaid && <CheckCircle2 size={14} color="white" />}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>Mostrar servicios ya cobrados</span>
                </div>
            </div>

            {/* Grouped List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {groupedServices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-card)', borderRadius: '24px', border: '1px dashed var(--border-light)' }}>
                        <FileText size={40} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p style={{ color: 'var(--text-secondary)', fontWeight: '750' }}>No hay facturas pendientes</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Todo está al día o no coincide con la búsqueda.</p>
                    </div>
                ) : (
                    groupedServices.map((group, idx) => (
                        <motion.div 
                            key={idx}
                            layout
                            style={{ 
                                background: 'var(--bg-card)', 
                                borderRadius: '24px', 
                                border: '1px solid var(--border-light)',
                                overflow: 'hidden',
                                boxShadow: 'var(--shadow-premium)'
                            }}
                        >
                            <div 
                                onClick={() => toggleSub(group.subscriber.id || 'idx-'+idx)}
                                style={{ 
                                    padding: '1.25rem', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    background: expandedSubs[group.subscriber.id || 'idx-'+idx] ? 'rgba(var(--accent-primary-rgb), 0.03)' : 'transparent'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ 
                                        width: '44px', 
                                        height: '44px', 
                                        borderRadius: '14px', 
                                        background: 'rgba(139, 92, 246, 0.1)', 
                                        color: '#8b5cf6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>{group.subscriber.name}</h3>
                                        {group.subscriber.officeNumber && (
                                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>DPTO: {group.subscriber.officeNumber}</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: '950', color: group.totalPending > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                            {group.totalPending.toFixed(2)}€
                                        </div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: '750', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pendiente</div>
                                    </div>
                                    <div style={{ color: 'var(--text-muted)' }}>
                                        {expandedSubs[group.subscriber.id || 'idx-'+idx] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {expandedSubs[group.subscriber.id || 'idx-'+idx] && (
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {group.services.map(service => (
                                                <div key={service.id} style={{
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    padding: '0.9rem 1rem', 
                                                    backgroundColor: 'var(--bg-secondary)', 
                                                    borderRadius: '16px',
                                                    border: '1px solid var(--border-light)',
                                                    opacity: service.isPaid ? 0.5 : 1
                                                }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <Clock size={14} color="var(--text-muted)" />
                                                            {format(new Date(service.timestamp), 'dd MMM, HH:mm', { locale: es })}
                                                        </div>
                                                        {service.observation && (
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500', marginTop: '2px', fontStyle: 'italic' }}>
                                                                "{service.observation}"
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ fontWeight: '900', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                                            {service.amount.toFixed(2)}€
                                                        </div>
                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={(e) => togglePaidStatus(e, service)}
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '10px',
                                                                background: service.isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(var(--text-muted-rgb), 0.1)',
                                                                border: 'none',
                                                                color: service.isPaid ? 'var(--success)' : 'var(--text-muted)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {service.isPaid ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Billing;
