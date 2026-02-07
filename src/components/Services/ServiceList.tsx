import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { format } from '../../utils/dateHelpers';
import { Edit2, Save, X, Trash2 } from 'lucide-react';
import { Service } from '../../types';

interface ServiceListProps {
    filterSource?: 'manual' | 'total';
}

const ServiceList: React.FC<ServiceListProps> = ({ filterSource }) => {
    const { services, updateService, deleteService } = useApp();
    const [editingId, setEditingId] = useState<number | null>(null);

    const filteredServices = services.filter(s => {
        if (!filterSource) return true;
        if (filterSource === 'manual') return s.source === 'manual' || !s.source;
        return s.source === filterSource;
    });

    const [editAmount, setEditAmount] = useState<number | string>('');
    const [editType, setEditType] = useState<'normal' | 'company' | 'facturado'>('normal');
    const [editObs, setEditObs] = useState<string>('');
    const [editCompany, setEditCompany] = useState<string>('');

    const handleEditClick = (service: Service) => {
        setEditingId(service.id);
        setEditAmount(service.amount);
        setEditType(service.type);
        setEditObs(service.observation || '');
        setEditCompany(service.companyName || '');
    };

    const handleDeleteClick = (id: number) => {
        if (window.confirm("¿Seguro que quieres eliminar este servicio? No se puede deshacer.")) {
            deleteService(id);
        }
    };

    const handleSave = (id: number) => {
        updateService(id, {
            amount: typeof editAmount === 'string' ? parseFloat(editAmount) : editAmount,
            type: editType,
            observation: editObs,
            companyName: editType === 'company' ? editCompany : undefined
        });
        setEditingId(null);
    };

    const handleCancel = () => {
        setEditingId(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredServices.map(service => {
                const isEditing = editingId === service.id;

                if (isEditing) {
                    return (
                        <div key={service.id} className="card" style={{ border: '1px solid var(--accent-primary)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {format(new Date(service.timestamp), 'dd/MM/yyyy HH:mm')} (Fecha no editable)
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
                                    <input
                                        placeholder="Nombre Compañía"
                                        value={editCompany} onChange={e => setEditCompany(e.target.value)}
                                    />
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
                        borderLeft: service.type === 'company' ? '4px solid var(--accent-secondary)' : '4px solid var(--accent-primary)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontWeight: '500', fontSize: '1rem' }}>
                                    {service.type === 'company' ? (service.companyName || 'Compañía') : 'Servicio Normal'}
                                </p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {format(new Date(service.timestamp), 'dd/MM/yyyy HH:mm')}
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
            {filteredServices.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay servicios registrados en esta categoría.</p>}
        </div>
    );
};

export default ServiceList;
