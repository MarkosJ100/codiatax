
import React, { useState, useOptimistic, useTransition, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';
import { useFormValidation } from '../../hooks/useFormValidation';
import { validators } from '../../utils/validators';
import { Save, Building2, CarTaxiFront, Loader2, Calendar, UserPlus, XCircle } from 'lucide-react';
import { Service } from '../../types';

const ServiceForm: React.FC = () => {
    const { addService, services, subscribers, addSubscriber, updateSubscriber } = useApp();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'taxi' | 'subscriber'>('taxi');
    const [amount, setAmount] = useState<string>('');
    const [selectedSubscriberId, setSelectedSubscriberId] = useState<string>('');
    const [officeNumberSearchTerm, setOfficeNumberSearchTerm] = useState(''); // New State
    const [observation, setObservation] = useState<string>('');
    const [serviceDate, setServiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isPending, startTransition] = useTransition();

    // Subscriber creation state
    const [showNewSubscriberModal, setShowNewSubscriberModal] = useState(false);
    const [newSubName, setNewSubName] = useState('');
    const [newSubOfficeNumber, setNewSubOfficeNumber] = useState('');
    const [isSubCapped, setIsSubCapped] = useState(false);
    const [subCapAmount, setSubCapAmount] = useState('7');

    // Reset form when switching tabs
    useEffect(() => {
        setAmount('');
        setSelectedSubscriberId('');
        setObservation('');
        resetValidation();
    }, [activeTab]);

    // Optimistic UI: show the new service immediately
    const [optimisticServices, addOptimisticService] = useOptimistic(
        services,
        (currentServices: Service[], newService: Omit<Service, 'id'>) => [
            { ...newService, id: Date.now() } as Service,
            ...currentServices
        ]
    );

    const { errors, touched, validate, validateAll, handleBlur, resetValidation, hasError, getError } = useFormValidation({
        amount: [
            { validator: (v) => validators.isNotEmpty(v), message: 'El importe es obligatorio' },
            { validator: (v) => validators.isValidAmount(v), message: 'Importe inválido (máx. 100,000€)' }
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
                if (sub.isCapped && meterAmount > sub.capAmount) {
                    finalAmount = sub.capAmount;
                }
            }
        }

        const newService: Omit<Service, 'id'> = {
            type: activeTab === 'subscriber' ? 'company' : 'normal',
            amount: finalAmount,
            originalAmount: meterAmount !== finalAmount ? meterAmount : undefined,
            companyName,
            subscriberId: activeTab === 'subscriber' ? selectedSubscriberId : undefined,
            observation: observation || undefined,
            timestamp: dateObj.toISOString(),
            source: 'manual' as const
        };

        startTransition(() => {
            addOptimisticService(newService);
            addService(newService);
        });

        setAmount('');
        setSelectedSubscriberId('');
        setObservation('');
        resetValidation();

        if (meterAmount !== finalAmount) {
            toast.info(`Importe ajustado al tope del abonado: ${finalAmount}€`);
        } else {
            toast.success('Servicio añadido correctamente');
        }
    };

    const handleCreateSubscriber = () => {
        if (!newSubName.trim()) return;

        // Validation for Office Number format: xxx.xxx
        const officeNumRegex = /^\d{3}\.\d{3}$/;
        if (newSubOfficeNumber && !officeNumRegex.test(newSubOfficeNumber)) {
            toast.error('El número de despacho debe tener el formato xxx.xxx (ej: 123.456)');
            return;
        }

        addSubscriber({
            name: newSubName.trim().toUpperCase(),
            isCapped: isSubCapped,
            capAmount: parseFloat(subCapAmount) || 0,
            officeNumber: newSubOfficeNumber || undefined
        });
        setNewSubName('');
        setNewSubOfficeNumber('');
        setShowNewSubscriberModal(false);
        toast.success('Abonado creado');
    };

    // Helper to get selected subscriber details
    const selectedSubscriber = subscribers.find(s => s.id === selectedSubscriberId);

    return (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '1rem 1rem 0' }}>
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Nuevo Registro Diario</h3>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                <button
                    type="button"
                    onClick={() => setActiveTab('taxi')}
                    style={{
                        flex: 1,
                        padding: '1rem',
                        background: activeTab === 'taxi' ? 'var(--accent-primary)' : 'var(--bg-card)',
                        border: 'none',
                        color: activeTab === 'taxi' ? '#ffffff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontWeight: activeTab === 'taxi' ? 'bold' : 'normal',
                        transition: 'all 0.2s',
                        borderRadius: 'var(--radius-md) 0 0 0'
                    }}
                >
                    <CarTaxiFront size={18} /> Taxi
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('subscriber')}
                    style={{
                        flex: 1,
                        padding: '1rem',
                        background: activeTab === 'subscriber' ? '#8b5cf6' : 'var(--bg-card)',
                        border: 'none',
                        color: activeTab === 'subscriber' ? '#ffffff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontWeight: activeTab === 'subscriber' ? 'bold' : 'normal',
                        transition: 'all 0.2s',
                        borderRadius: '0 var(--radius-md) 0 0'
                    }}
                >
                    <Building2 size={18} /> Abonados
                </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Date Field - Common */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Fecha del Servicio</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Calendar size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                            <input
                                type="date"
                                value={serviceDate}
                                onChange={(e) => setServiceDate(e.target.value)}
                                style={{
                                    paddingLeft: '40px',
                                    width: '100%'
                                }}
                            />
                        </div>
                    </div>

                    {/* Subscriber Tab Content */}
                    {activeTab === 'subscriber' && (
                        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>

                            {/* Subscriber Selection & Office Number Search */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>

                                {/* 1. Select Subscriber */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Abonado / Empresa</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewSubscriberModal(true)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--accent-primary)',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.1em' }}>+</span> Nuevo
                                        </button>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={selectedSubscriberId}
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                setSelectedSubscriberId(id);
                                                if (id) {
                                                    const sub = subscribers.find(s => s.id === id);
                                                    if (sub) {
                                                        // Auto-fill amount if capped
                                                        if (sub.isCapped && sub.capAmount) {
                                                            setAmount(sub.capAmount.toString());
                                                        } else {
                                                            setAmount('');
                                                        }
                                                        // Auto-fill Office Number field for visibility
                                                        // Only update if subscriber HAS a number.
                                                        // If they don't, keep whatever the user might have typed manually.
                                                        if (sub.officeNumber) {
                                                            setOfficeNumberSearchTerm(sub.officeNumber);
                                                        }
                                                    }
                                                } else {
                                                    setAmount('');
                                                    setOfficeNumberSearchTerm('');
                                                }
                                                if (touched.selectedSubscriberId) validate('selectedSubscriberId', id);
                                            }}
                                            onBlur={() => {
                                                handleBlur('selectedSubscriberId');
                                                validate('selectedSubscriberId', selectedSubscriberId);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '0.8rem',
                                                borderRadius: 'var(--radius-md)',
                                                border: hasError('selectedSubscriberId') ? '1px solid var(--danger)' : '1px solid var(--border-color)',
                                                backgroundColor: 'var(--bg-card)',
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem',
                                                appearance: 'none',
                                                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'right 0.7rem top 50%',
                                                backgroundSize: '0.65rem auto',
                                            }}
                                        >
                                            <option value="">-- Seleccionar de la lista --</option>
                                            {subscribers.map(sub => (
                                                <option key={sub.id} value={sub.id}>
                                                    {sub.name} {sub.officeNumber ? `(Despacho: ${sub.officeNumber})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {hasError('selectedSubscriberId') && (
                                            <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                                                {getError('selectedSubscriberId')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Office Number Input (Bi-directional) */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        Número de Despacho
                                    </label>
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <Building2 size={18} style={{ position: 'absolute', left: '10px', color: 'var(--text-tertiary)' }} />
                                        <input
                                            type="text"
                                            placeholder="Ej: 123.456 (Buscar por número)"
                                            style={{
                                                width: '100%',
                                                padding: '0.8rem 0.8rem 0.8rem 2.5rem',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-color)',
                                                backgroundColor: selectedSubscriber ? 'var(--bg-secondary)' : 'var(--bg-card)',
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem'
                                            }}
                                            value={officeNumberSearchTerm}
                                            onChange={(e) => {
                                                // Auto-format: remove non-digits, then chunks of 3
                                                let raw = e.target.value.replace(/\D/g, '');

                                                // Limit length if needed? User example is 6 digits (XXX.XXX). 
                                                // Let's allow flexible length but format dot every 3 chars.
                                                // "848768" -> "848768" -> "848.768"

                                                let formatted = '';
                                                if (raw.length > 3) {
                                                    formatted = raw.slice(0, 3) + '.' + raw.slice(3, 6);
                                                    if (raw.length > 6) formatted += '.' + raw.slice(6);
                                                } else {
                                                    formatted = raw;
                                                }

                                                // Update state with formatted value
                                                setOfficeNumberSearchTerm(formatted);

                                                // Search for subscriber with this formatted number
                                                const found = subscribers.find(s => s.officeNumber === formatted);
                                                if (found) {
                                                    setSelectedSubscriberId(found.id);
                                                    if (found.isCapped && found.capAmount) setAmount(found.capAmount.toString());
                                                } else {
                                                    // Only clear selection if the user is typing something new that doesn't match
                                                    // But if they just cleared the input, definitely clear.
                                                    if (formatted === '') {
                                                        setSelectedSubscriberId('');
                                                        setAmount('');
                                                    }
                                                    // If they typed a partial number that matches nothing, we don't deselect yet? 
                                                    // Actually, if the number doesn't match the currently selected sub's number, we should validly deselect to avoid confusion.
                                                    // But searching is loose? No, exact match required for auto-select.
                                                    if (selectedSubscriber && selectedSubscriber.officeNumber !== formatted) {
                                                        setSelectedSubscriberId('');
                                                        setAmount('');
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                        * Escribe el número exacto para autoseleccionar
                                    </div>
                                </div>

                            </div>

                            {selectedSubscriber && (
                                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedSubscriber.name}</span>
                                        {selectedSubscriber.isCapped && (
                                            <span style={{ color: 'var(--accent-primary)', fontSize: '0.8rem' }}>
                                                Tope: {selectedSubscriber.capAmount}€
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedSubscriberId(''); setAmount(''); setOfficeNumberSearchTerm(''); resetValidation(); }}
                                        style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer' }}
                                    >
                                        <XCircle size={18} color="var(--text-tertiary)" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Amount Field - Common */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Importe del Servicio (€)</label>
                            {activeTab === 'subscriber' && selectedSubscriber?.isCapped && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>Sujeto a tope</span>
                            )}
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => {
                                setAmount(e.target.value);
                                if (touched.amount) validate('amount', e.target.value);
                            }}
                            onBlur={() => {
                                handleBlur('amount');
                                validate('amount', amount);
                            }}
                            placeholder="0.00"
                            style={{
                                fontSize: '1.2rem',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                borderColor: hasError('amount') ? 'var(--danger)' : undefined
                            }}
                        />
                        {hasError('amount') && (
                            <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px' }}>
                                {getError('amount')}
                            </span>
                        )}
                        {activeTab === 'subscriber' && amount && selectedSubscriber?.isCapped && parseFloat(amount) > selectedSubscriber.capAmount && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                El importe real se registrará como <strong style={{ color: 'var(--text-primary)' }}>{selectedSubscriber.capAmount}€</strong> debido al tope.
                            </div>
                        )}
                    </div>

                    {/* Observations - Common */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Observaciones (Opcional)</label>
                        <textarea
                            rows={2}
                            placeholder="Incidencias, notas, trayecto..."
                            value={observation}
                            onChange={(e) => setObservation(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '1rem' }} disabled={isPending}>
                        {isPending ? <Loader2 size={20} className="animate-spin" style={{ marginRight: '8px' }} /> : <Save size={20} style={{ marginRight: '8px' }} />}
                        {isPending ? 'Guardando...' : activeTab === 'subscriber' ? 'Registrar Servicio Abonado' : 'Registrar Servicio Taxi'}
                    </button>
                </form>
            </div>

            {/* New Subscriber Modal */}
            {showNewSubscriberModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-card)' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Crear Nuevo Abonado</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Nombre</label>
                            <input
                                type="text"
                                value={newSubName}
                                onChange={(e) => setNewSubName(e.target.value)}
                                placeholder="Ej: RENAULT, HOTEL X..."
                                autoFocus
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Nº Despacho (Opcional)</label>
                            <input
                                type="text"
                                value={newSubOfficeNumber}
                                onChange={(e) => {
                                    // Auto-format for consistency
                                    let raw = e.target.value.replace(/\D/g, '');
                                    let formatted = '';
                                    if (raw.length > 3) {
                                        formatted = raw.slice(0, 3) + '.' + raw.slice(3, 6);
                                        if (raw.length > 6) formatted += '.' + raw.slice(6);
                                    } else {
                                        formatted = raw;
                                    }
                                    setNewSubOfficeNumber(formatted);
                                }}
                                placeholder="Ej: 123.456"
                            />
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Formato requerido: xxx.xxx</p>
                        </div>
                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="isCapped"
                                checked={isSubCapped}
                                onChange={(e) => setIsSubCapped(e.target.checked)}
                                style={{ width: 'auto' }}
                            />
                            <label htmlFor="isCapped" style={{ fontSize: '0.85rem' }}>¿Tiene tope de cobro?</label>
                        </div>
                        {isSubCapped && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Tope Máximo (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={subCapAmount}
                                    onChange={(e) => setSubCapAmount(e.target.value)}
                                />
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setShowNewSubscriberModal(false)}
                                style={{ flex: 1 }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleCreateSubscriber}
                                style={{ flex: 1 }}
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceForm;
