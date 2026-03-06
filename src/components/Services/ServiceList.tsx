import React, { useState } from 'react';
import { format, es } from '../../utils/dateHelpers';
import { Edit2, Save, X, Trash2 } from 'lucide-react';
import { Service } from '../../types';
import { useServices } from '../../context/ServiceContext';

interface ServiceListProps {
    filterSource?: 'manual' | 'total';
    typeFilter?: 'all' | 'taxi' | 'company';
}

const ServiceList: React.FC<ServiceListProps> = ({ filterSource, typeFilter = 'all' }) => {
    const { services, updateService, deleteService, subscribers, updateSubscriber } = useServices();
    const [editingId, setEditingId] = useState<number | null>(null);

    const filteredServices = services.filter(s => {
        // Source filter
        if (filterSource) {
            const matchesSource = filterSource === 'manual' ? (s.source === 'manual' || !s.source) : s.source === filterSource;
            if (!matchesSource) return false;
        }

        // Type filter
        if (typeFilter === 'taxi') {
            return s.type === 'normal' || s.type === 'facturado';
        }
        if (typeFilter === 'company') {
            return s.type === 'company';
        }

        return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Pagination Logic
    const [visibleCount, setVisibleCount] = useState(20);
    const visibleServices = filteredServices.slice(0, visibleCount);

    // Grouping Logic
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
    }, {} as Record<string, { date: Date, services: Service[], total: number }>);

    const sortedDays = Object.keys(groupedByDay).sort((a, b) => b.localeCompare(a));

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 20);
    };

    const [editAmount, setEditAmount] = useState<number | string>('');
    const [editType, setEditType] = useState<'normal' | 'company' | 'facturado'>('normal');
    const [editObs, setEditObs] = useState<string>('');
    const [editCompany, setEditCompany] = useState<string>('');
    const [editOfficeNumber, setEditOfficeNumber] = useState<string>('');
    const [editSubscriberId, setEditSubscriberId] = useState<string | undefined>(undefined);

    const handleEditClick = (service: Service) => {
        setEditingId(service.id);
        setEditAmount(service.amount);
        setEditType(service.type);
        setEditObs(service.observation || '');
        setEditCompany(service.companyName || '');

        if (service.subscriberId) {
            const sub = subscribers.find(s => s.id === service.subscriberId);
            setEditOfficeNumber(sub?.officeNumber || '');
            setEditSubscriberId(service.subscriberId);
        } else {
            setEditOfficeNumber('');
            setEditSubscriberId(undefined);
        }
    };

    const handleDeleteClick = (id: number) => {
        if (window.confirm("¿Seguro que quieres eliminar este servicio? No se puede deshacer.")) {
            deleteService(id);
        }
    };

    const handleSave = (id: number) => {
        if (editType === 'company' && editSubscriberId && editOfficeNumber) {
            const sub = subscribers.find(s => s.id === editSubscriberId);
            if (sub && sub.officeNumber !== editOfficeNumber) {
                updateSubscriber(editSubscriberId, { officeNumber: editOfficeNumber });
            }
        }

        updateService(id, {
            amount: typeof editAmount === 'string' ? parseFloat(editAmount) : editAmount,
            type: editType,
            observation: editObs,
            companyName: editType === 'company' ? editCompany : undefined,
            subscriberId: editType === 'company' ? editSubscriberId : undefined
        });
        setEditingId(null);
    };

    const handleCancel = () => {
        setEditingId(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sortedDays.map(dateKey => {
                const dayData = groupedByDay[dateKey];
                const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;
                const dateDisplay = isToday
                    ? `Hoy, ${format(dayData.date, "EEEE d 'de' MMMM", { locale: es })}`
                    : format(dayData.date, "EEEE d 'de' MMMM", { locale: es });

                return (
                    <div key={dateKey} style={{ marginBottom: '1.5rem' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '0.75rem',
                            borderLeft: '4px solid var(--accent-primary)'
                        }}>
                            <span style={{
                                fontWeight: '700',
                                textTransform: 'capitalize',
                                fontSize: '0.9rem',
                                color: 'var(--text-primary)'
                            }}>
                                {dateDisplay}
                            </span>
                            <span style={{
                                fontWeight: '800',
                                color: 'var(--accent-primary)',
                                fontSize: '1rem'
                            }}>
                                {dayData.total.toFixed(2)} €
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {dayData.services.map(service => {
                                const isEditing = editingId === service.id;

                                if (isEditing) {
                                    return (
                                        <div key={service.id} className="card" style={{ border: '1px solid var(--accent-primary)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {format(new Date(service.timestamp), 'HH:mm')} (Fecha no editable)
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <select value={editType} onChange={e => setEditType(e.target.value as any)} style={{ flex: 1 }}>
                                                        <option value="normal">Normal</option>
                                                        <option value="company">Compañía</option>
                                                        <option value="facturado">Facturado</option>
                                                    </select>
                                                    <input
                                                        type="number" step="0.01"
                                                        value={editAmount} onChange={e => setEditAmount(e.target.value)}
                                                        style={{ width: '100px', fontWeight: 'bold' }}
                                                    />
                                                </div>

                                                {editType === 'company' && (
                                                    <>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <input
                                                                placeholder="Nº Despacho"
                                                                value={editOfficeNumber}
                                                                onChange={(e) => {
                                                                    let raw = e.target.value.replace(/\D/g, '');
                                                                    let formatted = '';
                                                                    if (raw.length > 3) {
                                                                        formatted = raw.slice(0, 3) + '.' + raw.slice(3, 6);
                                                                        if (raw.length > 6) formatted += '.' + raw.slice(6);
                                                                    } else {
                                                                        formatted = raw;
                                                                    }
                                                                    setEditOfficeNumber(formatted);
                                                                    const sub = subscribers.find(s => s.officeNumber === formatted);
                                                                    if (sub) {
                                                                        setEditCompany(sub.name);
                                                                        setEditSubscriberId(sub.id);
                                                                    } else {
                                                                        setEditSubscriberId(undefined);
                                                                    }
                                                                }}
                                                                style={{ width: '100px' }}
                                                            />
                                                            <input
                                                                placeholder="Nombre Compañía"
                                                                value={editCompany} onChange={e => setEditCompany(e.target.value)}
                                                                style={{ flex: 1 }}
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                <input
                                                    placeholder="Observaciones"
                                                    value={editObs} onChange={e => setEditObs(e.target.value)}
                                                />

                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    <button onClick={handleCancel} className="btn-ghost" style={{ padding: '4px 8px', border: 'none', background: 'none', cursor: 'pointer' }}>
                                                        <X size={18} />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(service.id)} className="btn-ghost" style={{ padding: '4px 8px', color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <button onClick={() => handleSave(service.id)} className="btn btn-primary" style={{ padding: '4px 12px' }}>
                                                        <Save size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={service.id} className="card" style={{
                                        padding: '1rem',
                                        marginBottom: 0,
                                        borderLeft: service.type === 'company' ? '6px solid #8b5cf6' : '4px solid var(--accent-primary)',
                                        backgroundColor: service.type === 'company' ? 'rgba(139, 92, 246, 0.05)' : 'var(--bg-card)',
                                        transition: 'all 0.2s'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <p style={{
                                                    fontWeight: '700',
                                                    fontSize: '1rem',
                                                    color: service.type === 'company' ? '#8b5cf6' : 'var(--text-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    {service.type === 'company' && <span>🏢</span>}
                                                    {service.type === 'company' ? (service.companyName || 'Abonado') : '🚖 Servicio Taxi'}
                                                </p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {format(new Date(service.timestamp), 'HH:mm')}
                                                </p>
                                                {service.observation && (
                                                    <p style={{ fontSize: '0.85rem', marginTop: '4px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                                                        {service.observation}
                                                    </p>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--success)' }}>
                                                    {service.amount.toFixed(2)} €
                                                </span>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => handleDeleteClick(service.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleEditClick(service)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                </div>
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
                    style={{
                        padding: '12px',
                        marginTop: '1rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'all 0.2s'
                    }}
                >
                    Cargar más servicios ({filteredServices.length - visibleCount} restantes)
                </button>
            )}

            {filteredServices.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay servicios registrados en esta categoría.</p>}
        </div>
    );
};

export default ServiceList;
