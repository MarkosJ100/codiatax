import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';
import { useFormValidation } from '../../hooks/useFormValidation';
import { validators } from '../../utils/validators';
import { Gauge, Plus } from 'lucide-react';

const DailyMileageInput: React.FC = () => {
    const { addMileageLog, currentOdometer } = useApp();
    const toast = useToast();
    const [km, setKm] = useState<string>('');

    const { errors, validate, validateAll, handleBlur, resetValidation, hasError, getError } = useFormValidation({
        km: [
            { validator: (v) => validators.isNotEmpty(v), message: 'El kilometraje es obligatorio' },
            { validator: (v) => validators.isValidKilometers(v), message: 'Kilometraje inválido (máx. 10,000 km)' }
        ]
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateAll({ km })) {
            toast.error('Por favor, introduce un kilometraje válido');
            return;
        }

        addMileageLog(parseInt(km));
        setKm('');
        resetValidation();
        toast.success('Kilometraje actualizado correctamente');
    };

    return (
        <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                <Gauge size={20} style={{ marginRight: '8px', color: 'var(--accent-primary)' }} />
                Registrar Kilometraje Manual
            </h3>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Km actuales: <strong>{currentOdometer.toLocaleString()} km</strong>
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                <input
                    type="number"
                    placeholder="Recorrido hoy (km)"
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                    onBlur={() => {
                        handleBlur('km');
                        validate('km', km);
                    }}
                    style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        borderColor: hasError('km') ? 'var(--danger)' : undefined
                    }}
                />
                {hasError('km') && (
                    <span style={{
                        position: 'absolute',
                        bottom: '-20px',
                        left: 0,
                        color: 'var(--danger)',
                        fontSize: '0.75rem'
                    }}>
                        {getError('km')}
                    </span>
                )}
                <button type="submit" className="btn btn-primary" style={{ width: '50px', padding: 0, borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>
                    <Plus size={20} />
                </button>
            </form>
        </div>
    );
};

export default DailyMileageInput;
