import React, { useState } from 'react';
import { isSameDay } from '../../utils/dateHelpers';
import { useToast } from '../../hooks/useToast';
import { useFormValidation } from '../../hooks/useFormValidation';
import { validators } from '../../utils/validators';
import { Gauge, Plus, Zap } from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';

const DailyMileageInput: React.FC = () => {
    const { addMileageLog, currentOdometer, mileageLogs } = useVehicle();
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

        addMileageLog({ amount: parseInt(km), timestamp: new Date().toISOString() });
        if (!todayLog) setKm('');
        resetValidation();
        toast.success(todayLog ? 'Kilometraje actualizado' : 'Kilometraje registrado');
    };

    return (
        <div className="card" style={{ padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow-premium)', borderRadius: '24px', border: todayLog ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', background: todayLog ? 'rgba(var(--accent-primary-rgb), 0.1)' : 'var(--bg-body)', borderRadius: '12px' }}>
                        <Gauge size={20} color={todayLog ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '850', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                            {todayLog ? 'Kilometraje de Hoy' : 'Kilometraje Manual'}
                        </h3>
                        {todayLog && <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: '800' }}>REGISTRADO</span>}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Odometer</span>
                    <div style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--text-primary)' }}>{currentOdometer.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>km</span></div>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        type="number"
                        placeholder="Km recorridos..."
                        value={km}
                        onChange={(e) => setKm(e.target.value)}
                        onBlur={() => handleBlur('km')}
                        style={{
                            width: '100%',
                            height: '48px',
                            padding: '0 1rem',
                            borderRadius: '14px',
                            background: 'var(--bg-body)',
                            border: `1px solid ${hasError('km') ? 'var(--danger)' : 'var(--border-light)'}`,
                            fontWeight: '700',
                            fontSize: '1rem',
                            color: 'var(--text-primary)'
                        }}
                    />
                    {hasError('km') && (
                        <span style={{
                            position: 'absolute',
                            left: '8px',
                            bottom: '-18px',
                            color: 'var(--danger)',
                            fontSize: '0.65rem',
                            fontWeight: '700'
                        }}>
                            {getError('km')}
                        </span>
                    )}
                </div>
                <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ 
                        width: 'auto', 
                        padding: '0 1.5rem', 
                        borderRadius: '14px', 
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: todayLog ? 'none' : '0 4px 12px rgba(var(--accent-primary-rgb), 0.2)'
                    }}
                >
                    {todayLog ? <Zap size={18} /> : <Plus size={20} />}
                </button>
            </form>
        </div>
    );
};

export default DailyMileageInput;
