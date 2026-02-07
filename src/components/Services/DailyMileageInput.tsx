import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { isSameDay } from '../../utils/dateHelpers';
import { useToast } from '../../hooks/useToast';
import { useFormValidation } from '../../hooks/useFormValidation';
import { validators } from '../../utils/validators';
import { Gauge, Plus } from 'lucide-react';

const DailyMileageInput: React.FC = () => {
    const { addMileageLog, currentOdometer, mileageLogs } = useApp();
    const toast = useToast();

    // Detect if there's already a log for today
    const todayLog = mileageLogs.find(l => isSameDay(new Date(l.timestamp), new Date()));
    const [km, setKm] = useState<string>(todayLog ? todayLog.amount.toString() : '');

    const { validateAll, handleBlur, resetValidation, hasError, getError } = useFormValidation({
        km: [
            { validator: (v: string) => validators.isNotEmpty(v), message: 'El kilometraje es obligatorio' },
            { validator: (v: string) => validators.isValidKilometers(v), message: 'Kilometraje inválido (máx. 10,000 km)' }
        ]
    });

    // Update local state if mileageLogs change (e.g., from sync or other form)
    React.useEffect(() => {
        if (todayLog) {
            setKm(todayLog.amount.toString());
        }
    }, [todayLog]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateAll({ km })) {
            toast.error('Por favor, introduce un kilometraje válido');
            return;
        }

        addMileageLog(parseInt(km));
        if (!todayLog) setKm('');
        resetValidation();
        toast.success(todayLog ? 'Kilometraje actualizado' : 'Kilometraje registrado');
    };

    return (
        <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                <Gauge size={20} style={{ marginRight: '8px', color: 'var(--accent-primary)' }} />
                {todayLog ? 'Editar Kilometraje de Hoy' : 'Registrar Kilometraje Manual'}
            </h3>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Km totales acumulados: <strong>{currentOdometer.toLocaleString()} km</strong>
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                <input
                    type="number"
                    placeholder="Recorrido hoy (km)"
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                    onBlur={() => handleBlur('km')}
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
                <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 1.25rem', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>
                    {todayLog ? 'Actualizar' : <Plus size={20} />}
                </button>
            </form>
        </div>
    );
};

export default DailyMileageInput;
