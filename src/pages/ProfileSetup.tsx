import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    User as UserIcon, ShieldCheck, CreditCard, ChevronLeft,
    CheckCircle2, Save
} from 'lucide-react';
import { User, UserRole, WorkMode, ShiftType } from '../types';
import { normalizeUsername } from '../utils/userHelpers';
import { supabase } from '../supabase';

const ProfileSetup: React.FC = () => {
    const { shiftStorage, checkShiftCollision, showToast } = useApp();

    // UI State
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Profile, 2: Shift Config (for rotating)

    // Profile State
    const [role, setRole] = useState<UserRole>('propietario');
    const [name, setName] = useState('');
    const [license, setLicense] = useState('');
    const [workMode, setWorkMode] = useState<WorkMode>('solo');

    // Shift selection state
    const [shiftWeek, setShiftWeek] = useState<string>('Semana A');
    const [shiftType, setShiftType] = useState<ShiftType>('mañana');

    const handleStep1 = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return showToast("Introduce tu nombre", "error");
        if (!/^\d{3}$/.test(license)) return showToast("Licencia de 3 dígitos", "error");

        if (workMode === 'fixed') {
            setShiftType(role === 'propietario' ? 'mañana' : 'tarde');
            handleSaveProfile();
        } else if (workMode === 'rotating') {
            setStep(2);
        } else {
            handleSaveProfile();
        }
    };

    const handleSaveProfile = async (overrideShiftType?: ShiftType) => {
        setLoading(true);
        const finalShiftType = overrideShiftType || shiftType;

        try {
            // Check collisions for rotating shifts
            if (workMode === 'rotating') {
                const collisionOwner = checkShiftCollision(shiftWeek, finalShiftType, name);
                if (collisionOwner) {
                    setLoading(false);
                    return showToast(`El turno ya lo tiene ${collisionOwner}`, "error");
                }
            }

            // Update user metadata in Supabase
            const { error } = await supabase.auth.updateUser({
                data: {
                    name: normalizeUsername(name),
                    role,
                    licenseNumber: license,
                    workMode,
                    isShared: workMode !== 'solo',
                    shiftWeek,
                    shiftType: finalShiftType,
                    startTime: finalShiftType === 'mañana' ? '06:00' : '15:00',
                    endTime: finalShiftType === 'mañana' ? '15:00' : '00:00',
                    profileCompleted: true
                }
            });

            if (error) throw error;

            showToast("¡Perfil configurado correctamente!", "success");
            // The auth listener will detect the metadata change and redirect

        } catch (error: any) {
            showToast(error.message || "Error al guardar perfil", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
            justifyContent: 'center',
            maxWidth: '420px',
            margin: '0 auto'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    marginBottom: '0.5rem'
                }}>
                    Configura tu Perfil
                </h1>
                <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>
                    {step === 1 ? 'Paso 1: Información básica' : 'Paso 2: Configuración de turno'}
                </p>
            </div>

            <div className="card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                {step === 1 ? (
                    <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Role Selection */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '500' }}>¿Cuál es tu rol?</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setRole('propietario')}
                                    className={`btn ${role === 'propietario' ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{ flex: 1, border: '1px solid var(--border-color)', padding: '0.75rem' }}
                                >
                                    <ShieldCheck size={16} style={{ marginRight: '6px' }} /> Propietario
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('asalariado')}
                                    className={`btn ${role === 'asalariado' ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{ flex: 1, border: '1px solid var(--border-color)', padding: '0.75rem' }}
                                >
                                    <UserIcon size={16} style={{ marginRight: '6px' }} /> Asalariado
                                </button>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '500' }}>Nombre</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input"
                                placeholder="Tu nombre"
                                required
                            />
                        </div>

                        {/* License */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '500' }}>Número de Licencia</label>
                            <div style={{ position: 'relative' }}>
                                <CreditCard size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={license}
                                    onChange={e => setLicense(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                    className="input"
                                    placeholder="Ej: 123"
                                    style={{ paddingLeft: '40px' }}
                                    required
                                />
                            </div>
                        </div>

                        {/* Work Mode */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '500' }}>Modalidad del Taxi</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(['solo', 'fixed', 'rotating'] as WorkMode[]).map((mode) => (
                                    <div
                                        key={mode}
                                        onClick={() => setWorkMode(mode)}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '10px',
                                            border: workMode === mode ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                            backgroundColor: workMode === mode ? 'rgba(250, 204, 21, 0.1)' : 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: 'var(--bg-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.2rem'
                                        }}>
                                            {mode === 'solo' ? '🚗' : mode === 'fixed' ? '🤝' : '🔄'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                                {mode === 'solo' ? 'Conductor Único' : mode === 'fixed' ? 'Turnos Fijos' : 'Turnos Rotativos'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                                {mode === 'solo' ? 'Sin compañero' : mode === 'fixed' ? 'Siempre el mismo turno' : 'Alternando semanas'}
                                            </div>
                                        </div>
                                        {workMode === mode && <CheckCircle2 size={20} color="var(--accent-primary)" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ padding: '1rem', marginTop: '0.5rem' }} disabled={loading}>
                            {workMode === 'rotating' ? (
                                'Siguiente: Configurar Turno'
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    Guardar Perfil <Save size={18} />
                                </span>
                            )}
                        </button>
                    </form>
                ) : (
                    // STEP 2: ROTATING SHIFT CONFIG
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={() => setStep(1)}
                            className="btn-ghost"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0' }}
                        >
                            <ChevronLeft size={18} /> Volver
                        </button>

                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                Elige tu turno inicial para la <strong>Semana A</strong>:
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => handleSaveProfile('mañana')}
                                    className="btn btn-ghost"
                                    style={{
                                        flex: 1,
                                        border: '1px solid var(--border-color)',
                                        padding: '1.5rem 1rem',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                    disabled={loading}
                                >
                                    <span style={{ fontSize: '2rem' }}>☀️</span>
                                    <span style={{ fontWeight: '600' }}>Mañana</span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>06:00 - 15:00</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSaveProfile('tarde')}
                                    className="btn btn-ghost"
                                    style={{
                                        flex: 1,
                                        border: '1px solid var(--border-color)',
                                        padding: '1.5rem 1rem',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                    disabled={loading}
                                >
                                    <span style={{ fontSize: '2rem' }}>🌙</span>
                                    <span style={{ fontWeight: '600' }}>Tarde</span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>15:00 - 00:00</span>
                                </button>
                            </div>
                        </div>

                        {loading && (
                            <p style={{ textAlign: 'center', opacity: 0.6, marginTop: '1rem' }}>
                                Guardando perfil...
                            </p>
                        )}
                    </div>
                )}
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.7rem', opacity: 0.4, marginTop: '2rem' }}>
                CodiaTax v1.3.0
            </p>
        </div>
    );
};

export default ProfileSetup;
