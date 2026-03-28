import React, { useState } from 'react';
import { format, es } from '../../utils/dateHelpers';
import { Edit2, Trash2, TrendingUp } from 'lucide-react';
import { Service } from '../../types';
import { useServices } from '../../context/ServiceContext';

interface ServiceListProps {
    filterSource?: 'manual' | 'total';
    typeFilter?: 'all' | 'taxi' | 'company';
}

const ServiceList: React.FC<ServiceListProps> = ({ filterSource, typeFilter = 'all' }) => {
    const { services, updateService, deleteService, subscribers } = useServices();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [visibleCount, setVisibleCount] = useState(20);
    const [editAmount, setEditAmount] = useState<number | string>('');
    const [editType, setEditType] = useState<'normal' | 'company' | 'facturado'>('normal');
    const [editObs, setEditObs] = useState<string>('');
    const [editCompany, setEditCompany] = useState<string>('');
    const [editSubscriberId, setEditSubscriberId] = useState<string | undefined>(undefined);

    const isImportedService = (service: Service) => {
        const obs = service.observation || '';
        return obs.includes('SmartTD') || obs.includes('Taxitronic');
    };

    const getSourceLabel = (service: Service) => {
        if (service.source === 'total') return 'RESUMEN';
        if (isImportedService(service)) return 'IMPORTADO';
        return 'MANUAL';
    };

    const getSourceBadgeStyle = (service: Service) => {
        if (service.source === 'total') {
            return {
                backgroundColor: 'rgba(var(--accent-primary-rgb), 0.1)',
                color: 'var(--accent-primary)'
            };
        }
        if (isImportedService(service)) {
            return {
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6'
            };
        }
        return {
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b'
        };
    };

    const filteredServices = services
        .filter((service) => {
            if (filterSource) {
                const matchesSource = filterSource === 'manual'
                    ? service.source !== 'total'
                    : service.source === 'total';
                if (!matchesSource) return false;
            }

            if (typeFilter === 'taxi') {
                return service.type === 'normal' || service.type === 'facturado';
            }
            if (typeFilter === 'company') {
                return service.type === 'company';
            }

            return true;
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const visibleServices = filteredServices.slice(0, visibleCount);

    const groupedByDay = visibleServices.reduce((groups, service) => {
        const dateKey = format(new Date(service.timestamp), 'yyyy-MM-dd');
        if (!groups[dateKey]) {
            groups[dateKey] = {
                date: new Date(service.timestamp),
                services: [],
                total: 0
            };
        }
        groups[dateKey].services.push(service);
        groups[dateKey].total += service.amount;
        return groups;
    }, {} as Record<string, { date: Date; services: Service[]; total: number }>);

    const sortedDays = Object.keys(groupedByDay).sort((a, b) => b.localeCompare(a));

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 20);
    };

    const handleEditClick = (service: Service) => {
        setEditingId(service.id);
        setEditAmount(service.amount);
        setEditType(service.type);
        setEditObs(service.observation || '');
        setEditCompany(service.companyName || '');
        setEditSubscriberId(service.subscriberId);
    };

    const handleDeleteClick = (id: number) => {
        if (window.confirm('¿Seguro que quieres eliminar este servicio? No se puede deshacer.')) {
            deleteService(id);
        }
    };

    const handleSave = (id: number) => {
        updateService(id, {
            amount: typeof editAmount === 'string' ? parseFloat(editAmount) : editAmount,
            type: editType,
            observation: editObs,
            companyName: editType === 'company' ? editCompany : undefined,
            subscriberId: editType === 'company' ? editSubscriberId : undefined
        });
        setEditingId(null);
    };

    const renderTypeBadge = (service: Service) => {
        if (service.type === 'company') return <span style={{ fontSize: '0.65rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>ABONADO</span>;
        if (service.type === 'facturado') return <span style={{ fontSize: '0.65rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(var(--accent-primary-rgb), 0.1)', color: 'var(--accent-primary)' }}>FACTURADO</span>;
        return <span style={{ fontSize: '0.65rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>TAXI</span>;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sortedDays.map((dateKey) => {
                const dayData = groupedByDay[dateKey];
                const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;
                const dateDisplay = isToday
                    ? `Hoy, ${format(dayData.date, "EEEE d 'de' MMMM", { locale: es })}`
                    : format(dayData.date, "EEEE d 'de' MMMM", { locale: es });

                return (
                    <div key={dateKey} style={{ marginBottom: '1.5rem' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '0.75rem 1rem',
                                background: 'var(--bg-body)',
                                borderRadius: '16px',
                                marginBottom: '1rem',
                                border: '1px solid var(--border-light)',
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '2px' }}>Jornada</div>
                                <span style={{ fontWeight: '850', textTransform: 'capitalize', fontSize: '0.9rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                    {dateDisplay}
                                </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '2px' }}>Total día</div>
                                <span style={{ fontWeight: '900', color: 'var(--success)', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
                                    {dayData.total.toFixed(2)} €
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '0.85rem' }}>
                            {dayData.services.map((service) => {
                                const isEditing = editingId === service.id;

                                if (isEditing) {
                                    return (
                                        <div key={service.id} className="card" style={{ border: '2px solid var(--accent-primary)', background: 'rgba(var(--accent-primary-rgb), 0.03)', boxShadow: 'var(--shadow-premium)', padding: '1rem', borderRadius: '22px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                                        {format(new Date(service.timestamp), 'HH:mm')} · Editando registro
                                                    </span>
                                                </div>

                                                <div style={{ display: 'grid', gap: '1rem' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', lineHeight: 1.3 }}>Tipo</label>
                                                        <select value={editType} onChange={(e) => setEditType(e.target.value as 'normal' | 'company' | 'facturado')} style={{ width: '100%', minHeight: '46px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px', padding: '0 0.75rem', lineHeight: 1.4 }}>
                                                            <option value="normal">Normal</option>
                                                            <option value="company">Compañía</option>
                                                            <option value="facturado">Facturado</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', lineHeight: 1.3 }}>Importe (€)</label>
                                                        <input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} style={{ width: '100%', minHeight: '46px', fontWeight: '700', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px', padding: '0 0.75rem', lineHeight: 1.4 }} />
                                                    </div>
                                                </div>

                                                {editType === 'company' && (
                                                    <div>
                                                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', lineHeight: 1.3 }}>Abonado</label>
                                                        <select
                                                            value={editSubscriberId}
                                                            onChange={(e) => {
                                                                const sub = subscribers.find(s => s.id === e.target.value);
                                                                setEditSubscriberId(e.target.value);
                                                                if (sub) setEditCompany(sub.name);
                                                            }}
                                                            style={{ width: '100%', minHeight: '46px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px', padding: '0 0.75rem', lineHeight: 1.4 }}
                                                        >
                                                            <option value="">Seleccionar abonado</option>
                                                            {subscribers.map(sub => (
                                                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                <div>
                                                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', lineHeight: 1.3 }}>Observaciones</label>
                                                    <input placeholder="Añadir nota..." value={editObs} onChange={(e) => setEditObs(e.target.value)} style={{ width: '100%', minHeight: '46px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px', padding: '0 0.75rem', lineHeight: 1.4 }} />
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
                                                    <button onClick={() => setEditingId(null)} className="btn-ghost" style={{ minHeight: '46px' }}>
                                                        Cancelar
                                                    </button>
                                                    <button onClick={() => handleSave(service.id)} className="btn btn-primary" style={{ minHeight: '46px' }}>
                                                        Guardar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={service.id}
                                        className="card"
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '20px',
                                            boxShadow: 'var(--shadow-premium)',
                                            borderLeft: `4px solid ${service.source === 'total' ? 'var(--accent-primary)' : service.type === 'company' ? '#8b5cf6' : 'var(--success)'}`,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: '800',
                                                    color: 'var(--text-muted)',
                                                    background: 'var(--bg-body)',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px'
                                                }}>
                                                    {format(new Date(service.timestamp), 'HH:mm')}
                                                </span>
                                                <span style={{
                                                    fontWeight: '750',
                                                    fontSize: '0.95rem',
                                                    color: 'var(--text-primary)'
                                                }}>
                                                    {service.source === 'total'
                                                        ? (service.observation || 'Resumen diario')
                                                        : (service.companyName || (service.type === 'facturado' ? 'Facturado' : 'Carrera normal'))}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                {renderTypeBadge(service)}
                                                <span
                                                    style={{
                                                        fontSize: '0.65rem',
                                                        fontWeight: '800',
                                                        padding: '1px 6px',
                                                        borderRadius: '4px',
                                                        ...getSourceBadgeStyle(service)
                                                    }}
                                                >
                                                    {getSourceLabel(service)}
                                                </span>
                                                {service.observation && service.source !== 'total' && (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                        "{service.observation}"
                                                    </span>
                                                )}
                                            </div>

                                            {service.originalAmount && (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <TrendingUp size={10} />
                                                    Taxímetro: {service.originalAmount.toFixed(2)} € (tope aplicado)
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{
                                                    fontSize: '1.25rem',
                                                    fontWeight: '900',
                                                    color: 'var(--text-primary)',
                                                    letterSpacing: '-0.02em'
                                                }}>
                                                    {service.amount.toFixed(2)}<span style={{ fontSize: '0.85rem', marginLeft: '1px', color: 'var(--accent-primary)' }}>€</span>
                                                </div>
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '4px',
                                                paddingLeft: '10px',
                                                borderLeft: '1px solid var(--border-light)'
                                            }}>
                                                <button
                                                    onClick={() => handleEditClick(service)}
                                                    style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', display: 'flex' }}
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(service.id)}
                                                    style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', opacity: 0.6 }}
                                                    title="Borrar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {visibleCount < filteredServices.length && (
                <button
                    onClick={handleLoadMore}
                    className="btn-ghost"
                    style={{
                        padding: '12px',
                        marginTop: '1rem',
                        borderRadius: '16px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        width: '100%',
                        border: '1px solid var(--border-light)'
                    }}
                >
                    Cargar más servicios ({filteredServices.length - visibleCount} restantes)
                </button>
            )}

            {filteredServices.length === 0 && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '3rem 1rem',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: '24px',
                        border: '1px dashed var(--border-light)',
                        color: 'var(--text-muted)'
                    }}
                >
                    No hay servicios registrados en esta categoría.
                </div>
            )}
        </div>
    );
};

export default ServiceList;
