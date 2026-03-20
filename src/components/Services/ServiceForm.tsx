import React, { useState, useOptimistic, useTransition, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import { useFormValidation } from '../../hooks/useFormValidation';
import { validators } from '../../utils/validators';
import { Save, Building2, CarTaxiFront, Loader2, Calendar, XCircle, Trash2, MapPin } from 'lucide-react';
import { Service } from '../../types';
import { useServices } from '../../context/ServiceContext';
import { FinanceService } from '../../services/FinanceService';
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

    const [showNewSubscriberModal, setShowNewSubscriberModal] = useState(false);
    const [showManageSubscribersModal, setShowManageSubscribersModal] = useState(false);
    const [editingSubscriberId, setEditingSubscriberId] = useState<string | null>(null);
    const [newSubName, setNewSubName] = useState('');
    const [newSubOfficeNumber, setNewSubOfficeNumber] = useState('');
    const [isSubCapped, setIsSubCapped] = useState(false);
    const [subCapAmount, setSubCapAmount] = useState('7');

    useEffect(() => {
        setAmount('');
        setSelectedSubscriberId('');
        setDestination('');
        setObservation('');
        setOfficeNumberSearchTerm('');
        resetValidation();
    }, [activeTab]);

    const [, addOptimisticService] = useOptimistic(
        services,
        (currentServices: Service[], newService: Omit<Service, 'id'>) => [
            { ...newService, id: Date.now() } as Service,
            ...currentServices
        ]
    );

    const { validateAll, resetValidation, hasError, getError } = useFormValidation({
        amount: [
            { validator: (v) => validators.isNotEmpty(v), message: 'El importe es obligatorio' },
            { validator: (v) => validators.isValidAmount(v), message: 'Importe invalido' }
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
            const sub = subscribers.find((item) => item.id === selectedSubscriberId);
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
            source: 'manual'
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
            toast.success('Servicio anadido correctamente');
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

    const selectedSubscriber = subscribers.find((item) => item.id === selectedSubscriberId);

    return (
        <div className="card" style={{ overflow: 'hidden', padding: 0, boxShadow: 'var(--shadow-premium)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CarTaxiFront size={20} color="var(--accent-strong)" />
                </div>
                <div>
                    <div className="section-label" style={{ marginBottom: '0.2rem' }}>Nuevo registro</div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '850', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                        Alta diaria de servicio
                    </h3>
                </div>
            </div>

            <div style={{ padding: '1rem 1rem 0' }}>
                <div className="segmented-control">
                    <button type="button" className={activeTab === 'taxi' ? 'active' : ''} onClick={() => setActiveTab('taxi')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <CarTaxiFront size={16} />
                        <span>Taxi</span>
                    </button>
                    <button type="button" className={activeTab === 'subscriber' ? 'active' : ''} onClick={() => setActiveTab('subscriber')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Building2 size={16} />
                        <span>Abonados</span>
                    </button>
                </div>
            </div>

            <div style={{ padding: '1.5rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div className="form-group">
                        <label className="form-label">Fecha del servicio</label>
                        <div className="input-with-icon" style={{ background: 'var(--bg-elevated)', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
                            <Calendar size={18} color="var(--accent-primary)" />
                            <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} style={{ background: 'transparent', border: 'none', fontWeight: '600' }} />
                        </div>
                    </div>

                    {activeTab === 'taxi' && (
                        <div className="form-group animate-fade-in">
                            <label className="form-label">Concepto o destino</label>
                            <div className="input-with-icon" style={{ background: 'var(--bg-elevated)', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
                                <MapPin size={18} color="var(--accent-primary)" />
                                <input type="text" placeholder="Ej: Aeropuerto, centro, estacion..." value={destination} onChange={(e) => setDestination(e.target.value)} style={{ background: 'transparent', border: 'none', fontWeight: '600' }} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'subscriber' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label className="form-label" style={{ marginBottom: 0 }}>Abonado o empresa</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button type="button" onClick={() => setShowNewSubscriberModal(true)} className="btn-ghost" style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>Nuevo</button>
                                        <button type="button" onClick={() => setShowManageSubscribersModal(true)} className="btn-ghost" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>Gestionar</button>
                                    </div>
                                </div>
                                <div style={{ background: 'var(--bg-elevated)', borderRadius: '14px', border: `1px solid ${hasError('selectedSubscriberId') ? 'var(--danger)' : 'var(--border-light)'}`, padding: '0 8px' }}>
                                    <select
                                        value={selectedSubscriberId}
                                        onChange={(e) => {
                                            const id = e.target.value;
                                            setSelectedSubscriberId(id);
                                            if (id) {
                                                const sub = subscribers.find((item) => item.id === id);
                                                if (sub) {
                                                    if (sub.isCapped && sub.capAmount) setAmount(sub.capAmount.toString());
                                                    if (sub.officeNumber) setOfficeNumberSearchTerm(sub.officeNumber);
                                                }
                                            } else {
                                                setAmount('');
                                                setOfficeNumberSearchTerm('');
                                            }
                                        }}
                                        style={{ width: '100%', height: '48px', background: 'transparent', border: 'none', fontWeight: '600', outline: 'none' }}
                                    >
                                        <option value="">Selecciona un abonado</option>
                                        {subscribers.map((sub) => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {hasError('selectedSubscriberId') && <span className="error-text">{getError('selectedSubscriberId')}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Numero de despacho</label>
                                <div className="input-with-icon" style={{ background: 'var(--bg-elevated)', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
                                    <Building2 size={18} color="var(--accent-primary)" />
                                    <input
                                        type="text"
                                        placeholder="123.456"
                                        value={officeNumberSearchTerm}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, '');
                                            const formatted = raw.length > 3 ? raw.slice(0, 3) + '.' + raw.slice(3, 6) : raw;
                                            setOfficeNumberSearchTerm(formatted);
                                            const found = subscribers.find((item) => item.officeNumber === formatted);
                                            if (found) {
                                                setSelectedSubscriberId(found.id);
                                                if (found.isCapped) setAmount(found.capAmount.toString());
                                            }
                                        }}
                                        style={{ background: 'transparent', border: 'none', fontWeight: '600' }}
                                    />
                                </div>
                            </div>

                            {selectedSubscriber && (
                                <div style={{ padding: '12px 16px', background: 'rgba(var(--accent-primary-rgb), 0.06)', borderRadius: '16px', border: '1px solid rgba(var(--accent-primary-rgb), 0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)' }}>{selectedSubscriber.name}</div>
                                        {selectedSubscriber.isCapped && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Tope aplicado: {selectedSubscriber.capAmount} EUR</div>}
                                    </div>
                                    <button type="button" onClick={() => { setSelectedSubscriberId(''); setAmount(''); setOfficeNumberSearchTerm(''); }} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '999px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <XCircle size={16} color="var(--text-muted)" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Importe del servicio</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                style={{ fontSize: '2.4rem', fontWeight: '900', padding: '1.1rem 4rem 1.1rem 1.2rem', width: '100%', background: 'var(--bg-elevated)', border: `2px solid ${hasError('amount') ? 'var(--danger)' : 'var(--border-light)'}`, borderRadius: '20px', letterSpacing: '-0.03em', textAlign: 'right' }}
                            />
                            <span style={{ position: 'absolute', top: '50%', right: '1.2rem', transform: 'translateY(-50%)', fontSize: '1.35rem', fontWeight: '900', color: 'var(--accent-primary)' }}>EUR</span>
                        </div>
                        {hasError('amount') && <span className="error-text">{getError('amount')}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notas opcionales</label>
                        <div className="input-with-icon" style={{ background: 'var(--bg-elevated)', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
                            <MapPin size={18} color="var(--text-muted)" />
                            <input type="text" placeholder="Referencia, observacion o detalle..." value={observation} onChange={(e) => setObservation(e.target.value)} style={{ background: 'transparent', border: 'none' }} />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ height: '56px', borderRadius: '16px', fontWeight: '850', fontSize: '1rem', marginTop: '0.25rem' }} disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        <span>{isPending ? 'Guardando...' : 'Registrar servicio'}</span>
                    </button>
                </form>
            </div>

            {showNewSubscriberModal && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in" style={{ borderRadius: '28px', border: '1px solid var(--border-light)' }}>
                        <div className="modal-header">
                            <h3>{editingSubscriberId ? 'Editar abonado' : 'Nuevo abonado'}</h3>
                            <button onClick={() => { setShowNewSubscriberModal(false); setEditingSubscriberId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><XCircle /></button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Nombre</label>
                                <input type="text" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="Nombre empresa" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Despacho</label>
                                <input type="text" value={newSubOfficeNumber} onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, '');
                                    setNewSubOfficeNumber(raw.length > 3 ? raw.slice(0, 3) + '.' + raw.slice(3, 6) : raw);
                                }} placeholder="123.456" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="checkbox" checked={isSubCapped} onChange={(e) => setIsSubCapped(e.target.checked)} style={{ width: 'auto' }} />
                                <label>Tiene tope?</label>
                            </div>
                            {isSubCapped && (
                                <div className="form-group">
                                    <label className="form-label">Tope en EUR</label>
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
                    <div className="modal-content animate-fade-in" style={{ borderRadius: '28px', border: '1px solid var(--border-light)', maxHeight: '80vh' }}>
                        <div className="modal-header">
                            <h3>Gestionar abonados</h3>
                            <button onClick={() => setShowManageSubscribersModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><XCircle /></button>
                        </div>
                        <div className="modal-body">
                            {subscribers.length === 0 ? (
                                <p className="empty-state">No hay abonados.</p>
                            ) : (
                                <div className="subscriber-list">
                                    {subscribers.map((sub) => (
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
                                Anadir nuevo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceForm;
