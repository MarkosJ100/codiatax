import React, { useState, useOptimistic, useTransition } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';
import { useFormValidation } from '../../hooks/useFormValidation';
import { validators } from '../../utils/validators';
import { Save, Building2, User, Loader2 } from 'lucide-react';
import { Service } from '../../types';

const ServiceForm: React.FC = () => {
    const { addService, services } = useApp();
    const toast = useToast();
    const [type, setType] = useState<'normal' | 'company'>('normal');
    const [amount, setAmount] = useState<string>('');
    const [companyName, setCompanyName] = useState<string>('');
    const [observation, setObservation] = useState<string>('');
    const [isPending, startTransition] = useTransition();

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
        companyName: [
            { validator: (v) => type === 'company' ? validators.isNotEmpty(v) : true, message: 'El nombre de la compañía es obligatorio' }
        ]
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateAll({ amount, companyName })) {
            toast.error('Por favor, corrige los errores del formulario');
            return;
        }

        const newService = {
            type,
            amount: parseFloat(amount),
            companyName: type === 'company' ? companyName : undefined,
            observation: observation || undefined,
            timestamp: new Date().toISOString(),
            source: 'manual' as const
        };

        startTransition(() => {
            addOptimisticService(newService);
            addService(newService);
        });

        setAmount('');
        setCompanyName('');
        setObservation('');
        resetValidation();
        toast.success('Servicio añadido correctamente');
    };

    return (
        <div className="card">
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Nuevo Registro Diario</h3>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                    className={`btn ${type === 'normal' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setType('normal')}
                    style={{ flex: 1, border: type === 'normal' ? 'none' : '1px solid var(--text-muted)', cursor: 'pointer' }}
                >
                    <User size={18} style={{ marginRight: '6px' }} /> Servicio
                </button>
                <button
                    className={`btn ${type === 'company' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setType('company')}
                    style={{ flex: 1, border: type === 'company' ? 'none' : '1px solid var(--text-muted)', cursor: 'pointer' }}
                >
                    <Building2 size={18} style={{ marginRight: '6px' }} /> Compañía
                </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {type === 'company' && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nombre Compañía</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => {
                                setCompanyName(e.target.value);
                                if (touched.companyName) validate('companyName', e.target.value);
                            }}
                            onBlur={() => {
                                handleBlur('companyName');
                                validate('companyName', companyName);
                            }}
                            placeholder="Nombre de la compañía"
                            style={{
                                borderColor: hasError('companyName') ? 'var(--danger)' : undefined
                            }}
                        />
                        {hasError('companyName') && (
                            <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px' }}>
                                {getError('companyName')}
                            </span>
                        )}
                    </div>
                )}

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Importe (€)</label>
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
                            fontSize: '1.1rem',
                            borderColor: hasError('amount') ? 'var(--danger)' : undefined
                        }}
                    />
                    {hasError('amount') && (
                        <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px' }}>
                            {getError('amount')}
                        </span>
                    )}
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Observaciones (Opcional)</label>
                    <textarea
                        rows={2}
                        placeholder="Incidencias, notas..."
                        value={observation}
                        onChange={(e) => setObservation(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={isPending}>
                    {isPending ? <Loader2 size={20} className="animate-spin" style={{ marginRight: '8px' }} /> : <Save size={20} style={{ marginRight: '8px' }} />}
                    {isPending ? 'Guardando...' : 'Guardar Servicio'}
                </button>
            </form>
        </div>
    );
};

export default ServiceForm;
