import React, { useState, useOptimistic, useTransition, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import { useFormValidation } from '../../hooks/useFormValidation';
import { validators } from '../../utils/validators';
import { Save, Building2, CarTaxiFront, Loader2, Calendar, UserPlus, XCircle, Trash2, MapPin } from 'lucide-react';
import { Service } from '../../types';
import { useServices } from '../../context/ServiceContext';
import { FinanceService } from '../../services/FinanceService';
import TabSelector from '../Common/TabSelector';
import './Services.css';

const ServiceForm: React.FC = () => {
    const { addService, services, subscribers, addSubscriber, deleteSubscriber, updateSubscriber } = useServices();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'taxi' | 'subscriber'>('taxi');
    const [amount, setAmount] = useState<string>('');
    const [destination, setDestination] = useState<string>('');
    const [selectedSubscriberId, setSelectedSubscriberId] = useState<string>('');
    const [officeNumberSearchTerm, setOfficeNumberSearchTerm] = useState('');
    const [observation, setObservation] = useState<string>('');
    const [serviceDate, setServiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isPending, startTransition] = useTransition();

    // Subscriber management state
    const [showNewSubscriberModal, setShowNewSubscriberModal] = useState(false);
    const [showManageSubscribersModal, setShowManageSubscribersModal] = useState(false);
    const [editingSubscriberId, setEditingSubscriberId] = useState<string | null>(null);
    const [newSubName, setNewSubName] = useState('');
    const [newSubOfficeNumber, setNewSubOfficeNumber] = useState('');
    const [isSubCapped, setIsSubCapped] = useState(false);
    const [subCapAmount, setSubCapAmount] = useState('7');

    // Reset form when switching tabs
    useEffect(() => {
        setAmount('');
        setSelectedSubscriberId('');
        setDestination('');
        setObservation('');
        setOfficeNumberSearchTerm('');
        resetValidation();
    }, [activeTab]);

    // Optimistic UI
    const [, addOptimisticService] = useOptimistic(
        services,
        (currentServices: Service[], newService: Omit<Service, 'id'>) => [
            { ...newService, id: Date.now() } as Service,
            ...currentServices
        ]
    );

    const { errors, touched, validate, validateAll, handleBlur, resetValidation, hasError, getError } = useFormValidation({
        amount: [
            { validator: (v) => validators.isNotEmpty(v), message: 'El importe es obligatorio' },
            { validator: (v) => validators.isValidAmount(v), message: 'Importe inválido' }
        ],
        selectedSubscriberId: [
            { validator: (v) => activeTab === 'subscriber' ? validators.isNotEmpty(v) : true, message: 'Debes seleccionar un abonado' }
        ]
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateAll({ amount, selectedSubscriberId })) {
            toast.error('Por favor, corrige los errores del formulario');
            return;
        }

        const [year, month, day] = serviceDate.split('-').map(Number);
        const dateObj = new Date();
        dateObj.setFullYear(year);
        dateObj.setMonth(month - 1);
        dateObj.setDate(day);

        const meterAmount = parseFloat(amount);
        let finalAmount = meterAmount;
        let companyName: string | undefined;

        if (activeTab === 'subscriber') {
            const sub = subscribers.find(s => s.id === selectedSubscriberId);
            if (sub) {
                companyName = sub.name;
                finalAmount = FinanceService.applySubscriberCap(meterAmount, sub);
            }
        }

        const newService: Omit<Service, 'id'> = {
            type: activeTab === 'subscriber' ? 'company' : 'normal',
            amount: finalAmount,
            originalAmount: meterAmount !== finalAmount ? meterAmount : undefined,
            companyName,
            subscriberId: activeTab === 'subscriber' ? selectedSubscriberId : undefined,
            observation: observation || destination || undefined,
            timestamp: dateObj.toISOString(),
            source: 'manual' as const
        };

        startTransition(() => {
            addOptimisticService(newService);
            addService(newService);
        });

        setAmount('');
        setSelectedSubscriberId('');
        setDestination('');
        setObservation('');
        setOfficeNumberSearchTerm('');
        resetValidation();

        if (meterAmount !== finalAmount) {
            toast.info(`Importe ajustado al tope del abonado: ${FinanceService.formatCurrency(finalAmount)}`);
        } else {
            toast.success('Servicio añadido correctamente');
        }
    };

    const handleCreateSubscriber = () => {
        if (!newSubName.trim()) return;

        const officeNumRegex = /^\d{3}\.\d{3}$/;
        if (newSubOfficeNumber && !officeNumRegex.test(newSubOfficeNumber)) {
            toast.error('Formato despacho incorrecto (xxx.xxx)');
            return;
        }

        const subData = {
            name: newSubName.trim().toUpperCase(),
            isCapped: isSubCapped,
            capAmount: parseFloat(subCapAmount) || 0,
            officeNumber: newSubOfficeNumber || undefined
        };

        if (editingSubscriberId) {
            updateSubscriber(editingSubscriberId, subData);
            toast.success('Abonado actualizado');
        } else {
            addSubscriber(subData);
            toast.success('Abonado creado');
        }

        setNewSubName('');
        setNewSubOfficeNumber('');
        setEditingSubscriberId(null);
        setShowNewSubscriberModal(false);
    };

    const handleEditSubscriber = (sub: any) => {
        setEditingSubscriberId(sub.id);
        setNewSubName(sub.name);
        setNewSubOfficeNumber(sub.officeNumber || '');
        setIsSubCapped(sub.isCapped);
        setSubCapAmount(sub.capAmount?.toString() || '7');
        setShowManageSubscribersModal(false);
        setShowNewSubscriberModal(true);
    };

    const selectedSubscriber = subscribers.find(s => s.id === selectedSubscriberId);

    return (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <div className="service-form-header">
                <h3>Nuevo Registro Diario</h3>
            </div>

            <TabSelector
                options={[
                    { id: 'taxi', label: 'Taxi', icon: <CarTaxiFront size={18} /> },
                    { id: 'subscriber', label: 'Abonados', icon: <Building2 size={18} /> }
                ]}
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as any)}
                style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', border: 'none', borderBottom: '1px solid var(--border-color)' }}
            />

            <div className="form-content">
                <form onSubmit={handleSubmit}>

                    {/* Date Field */}
                    <div className="form-group">
                        <label className="form-label">Fecha del Servicio</label>
                        <div className="input-with-icon">
                            <Calendar size={18} />
                            <input
                                type="date"
                                value={serviceDate}
                                onChange={(e) => setServiceDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Taxi Tab Specific */}
                    {activeTab === 'taxi' && (
                        <div className="animate-fade-in">
                            <div className="form-group">
                                <label className="form-label">Concepto / Destino</label>
                                <div className="input-with-icon">
                                    <MapPin size={18} />
                                    <input
                                        type="text"
                                        placeholder="Ej: Centro Ciudad, Aeropuerto..."
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subscriber Tab Specific */}
                    {activeTab === 'subscriber' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <div className="subscriber-actions">
                                    <label className="form-label">Abonado / Empresa</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button type="button" onClick={() => setShowNewSubscriberModal(true)} className="btn-ghost-primary">
                                            <span>+</span> Nuevo
                                        </button>
                                        <button type="button" onClick={() => setShowManageSubscribersModal(true)} className="btn-ghost-secondary">
                                            <Save size={14} /> Gestionar
                                        </button>
                                    </div>
                                </div>
                                <div className="input-with-icon" style={{ display: 'block' }}>
                                    <select
                                        value={selectedSubscriberId}
                                        onChange={(e) => {
                                            const id = e.target.value;
                                            setSelectedSubscriberId(id);
                                            if (id) {
                                                const sub = subscribers.find(s => s.id === id);
                                                if (sub) {
                                                    if (sub.isCapped && sub.capAmount) setAmount(sub.capAmount.toString());
                                                    if (sub.officeNumber) setOfficeNumberSearchTerm(sub.officeNumber);
                                                }
                                            } else {
                                                setAmount('');
                                                setOfficeNumberSearchTerm('');
                                            }
                                        }}
                                        className={hasError('selectedSubscriberId') ? 'error' : ''}
                                        style={{ paddingLeft: '12px' }}
                                    >
                                        <option value="">-- Seleccionar de la lista --</option>
                                        {subscribers.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </select>
                                    {hasError('selectedSubscriberId') && <span className="error-text">{getError('selectedSubscriberId')}</span>}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Número de Despacho</label>
                                <div className="input-with-icon">
                                    <Building2 size={18} />
                                    <input
                                        type="text"
                                        placeholder="Ej: 123.456"
                                        value={officeNumberSearchTerm}
                                        onChange={(e) => {
                                            let raw = e.target.value.replace(/\D/g, '');
                                            let formatted = raw.length > 3 ? raw.slice(0, 3) + '.' + raw.slice(3, 6) : raw;
                                            setOfficeNumberSearchTerm(formatted);
                                            const found = subscribers.find(s => s.officeNumber === formatted);
                                            if (found) {
                                                setSelectedSubscriberId(found.id);
                                                if (found.isCapped) setAmount(found.capAmount.toString());
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {selectedSubscriber && (
                                <div className="subscriber-info-card animate-fade-in">
                                    <div className="subscriber-info-details">
                                        <span className="subscriber-info-name">{selectedSubscriber.name}</span>
                                        {selectedSubscriber.isCapped && <span className="subscriber-info-cap">Tope: {selectedSubscriber.capAmount}€</span>}
                                    </div>
                                    <button type="button" onClick={() => { setSelectedSubscriberId(''); setAmount(''); setOfficeNumberSearchTerm(''); }} style={{ background: 'none', border: 'none' }}>
                                        <XCircle size={18} color="var(--text-tertiary)" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Common Amount Field */}
                    <div className="form-group" style={{ marginTop: activeTab === 'taxi' ? '0' : '1.25rem' }}>
                        <div className="form-label-row">
                            <label className="form-label">Importe (€)</label>
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className={`amount-input ${hasError('amount') ? 'error' : ''}`}
                            style={{ fontSize: '1.5rem', fontWeight: 700, padding: '1rem' }}
                        />
                        {hasError('amount') && <span className="error-text">{getError('amount')}</span>}
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', height: '3.5rem' }} disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin" /> : <Save />}
                        <span style={{ marginLeft: '8px' }}>{isPending ? 'Guardando...' : 'Registrar Servicio'}</span>
                    </button>
                </form>
            </div>

            {/* Modals */}
            {showNewSubscriberModal && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in">
                        <div className="modal-header">
                            <h3>{editingSubscriberId ? 'Editar Abonado' : 'Nuevo Abonado'}</h3>
                            <button onClick={() => { setShowNewSubscriberModal(false); setEditingSubscriberId(null); }} style={{ background: 'none', border: 'none' }}><XCircle /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Nombre</label>
                                <input type="text" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="Nombre Empresa" />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Despacho (xxx.xxx)</label>
                                <input type="text" value={newSubOfficeNumber} onChange={(e) => {
                                    let raw = e.target.value.replace(/\D/g, '');
                                    setNewSubOfficeNumber(raw.length > 3 ? raw.slice(0, 3) + '.' + raw.slice(3, 6) : raw);
                                }} placeholder="123.456" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="checkbox" checked={isSubCapped} onChange={(e) => setIsSubCapped(e.target.checked)} />
                                <label>¿Tiene tope?</label>
                            </div>
                            {isSubCapped && (
                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label className="form-label">Tope (€)</label>
                                    <input type="number" value={subCapAmount} onChange={(e) => setSubCapAmount(e.target.value)} />
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowNewSubscriberModal(false)} style={{ flex: 1 }}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleCreateSubscriber} style={{ flex: 1 }}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {showManageSubscribersModal && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in">
                        <div className="modal-header">
                            <h3>Gestionar Abonados</h3>
                            <button onClick={() => setShowManageSubscribersModal(false)} style={{ background: 'none', border: 'none' }}><XCircle /></button>
                        </div>
                        <div className="modal-body">
                            {subscribers.length === 0 ? <p className="empty-state">No hay abonados.</p> : (
                                <div className="subscriber-list">
                                    {subscribers.map(sub => (
                                        <div key={sub.id} className="subscriber-list-item">
                                            <div className="subscriber-item-info">
                                                <span className="subscriber-item-name">{sub.name}</span>
                                                <span className="subscriber-item-meta">{sub.officeNumber || 'Sin despacho'}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn-ghost-primary" style={{ padding: '8px' }} onClick={() => handleEditSubscriber(sub)}>
                                                    <Save size={16} />
                                                </button>
                                                <button className="btn-delete-rounded" onClick={() => deleteSubscriber(sub.id)}><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setShowManageSubscribersModal(false); setShowNewSubscriberModal(true); }}>
                                + Añadir Nuevo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceForm;
