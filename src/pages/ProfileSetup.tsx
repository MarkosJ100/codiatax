import React, { useState } from 'react';
import { useShifts } from '../context/ShiftContext';
import { useUI } from '../context/UIContext';
import {
    User as UserIcon, ShieldCheck, CreditCard, ChevronLeft,
    CheckCircle2, Save, ArrowRight, Info
} from 'lucide-react';
import { User, UserRole, WorkMode, ShiftType } from '../types';
import { normalizeUsername } from '../utils/userHelpers';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileSetup: React.FC = () => {
    const { checkShiftCollision } = useShifts();
    const { showToast } = useUI();

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

        } catch (error: any) {
            showToast(error.message || "Error al guardar perfil", "error");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.85rem 1rem',
        borderRadius: '16px',
        backgroundColor: 'var(--bg-input)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-light)',
        transition: 'all 0.2s',
        fontSize: '0.95rem',
        fontWeight: '500'
    };

    const cardStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        borderRadius: '28px',
        padding: '1.5rem',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-premium)',
        marginBottom: '1rem'
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem 1.5rem',
            maxWidth: '500px',
            margin: '0 auto',
            background: 'var(--bg-main)'
        }}>
            {/* Logo or App Name */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                >
                    🚖
                </motion.div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '950', letterSpacing: '-0.02em', margin: 0 }}>Bienvenido a <span style={{ color: 'var(--accent-primary)' }}>CodiaTax</span></h1>
                <p style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem', marginTop: '4px' }}>Vamos a configurar tu entorno de trabajo</p>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div
                        key="step1"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                    >
                        <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Role Selection */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: '850', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>¿Cuál es tu rol?</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {[
                                        { id: 'propietario', label: 'Propietario', icon: <ShieldCheck size={20} /> },
                                        { id: 'asalariado', label: 'Asalariado', icon: <UserIcon size={20} /> }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setRole(opt.id as any)}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: '16px',
                                                background: role === opt.id ? 'var(--accent-primary)' : 'var(--bg-card)',
                                                color: role === opt.id ? 'white' : 'var(--text-primary)',
                                                border: `2px solid ${role === opt.id ? 'var(--accent-primary)' : 'var(--border-light)'}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                fontWeight: '800',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                boxShadow: role === opt.id ? '0 8px 16px -4px rgba(250, 204, 21, 0.3)' : 'none'
                                            }}
                                        >
                                            {opt.icon} {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={cardStyle}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: '850', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tu Nombre</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            style={inputStyle as any}
                                            placeholder="Ej: Manuel García"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: '850', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Número de Licencia</label>
                                        <div style={{ position: 'relative' }}>
                                            <CreditCard size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={license}
                                                onChange={e => setLicense(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                                style={{ ...inputStyle, paddingLeft: '2.75rem' } as any}
                                                placeholder="Ej: 123"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Work Mode */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: '850', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Modalidad de Gestión</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {(['solo', 'fixed', 'rotating'] as WorkMode[]).map((mode) => (
                                        <motion.div
                                            key={mode}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setWorkMode(mode)}
                                            style={{
                                                padding: '14px',
                                                borderRadius: '20px',
                                                border: `2px solid ${workMode === mode ? 'var(--accent-primary)' : 'var(--border-light)'}`,
                                                background: workMode === mode ? 'rgba(var(--accent-primary-rgb), 0.05)' : 'var(--bg-card)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '14px',
                                                transition: 'all 0.2s',
                                                boxShadow: workMode === mode ? 'var(--shadow-premium)' : 'none'
                                            }}
                                        >
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '14px',
                                                background: workMode === mode ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                                color: workMode === mode ? 'white' : 'var(--text-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.5rem',
                                                transition: 'all 0.2s'
                                            }}>
                                                {mode === 'solo' ? '🚗' : mode === 'fixed' ? '🤝' : '🔄'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--text-primary)' }}>
                                                    {mode === 'solo' ? 'Conductor Único' : mode === 'fixed' ? 'Turnos Fijos' : 'Turnos Rotativos'}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                                    {mode === 'solo' ? 'Gestionas el taxi tú solo' : mode === 'fixed' ? 'Turno compartido inamovible' : 'Turno compartido que cambia por semanas'}
                                                </div>
                                            </div>
                                            {workMode === mode && <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={16} color="white" /></div>}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <motion.button 
                                type="submit" 
                                whileTap={{ scale: 0.98 }}
                                disabled={loading}
                                style={{ 
                                    padding: '1.15rem', 
                                    background: 'var(--accent-primary)', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '20px', 
                                    fontSize: '1.1rem', 
                                    fontWeight: '950', 
                                    marginTop: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    boxShadow: '0 12px 24px -10px rgba(250, 204, 21, 0.4)'
                                }}
                            >
                                {workMode === 'rotating' ? 'Configurar Turnos' : 'Finalizar Setup'}
                                <ArrowRight size={20} />
                            </motion.button>
                        </form>
                    </motion.div>
                ) : (
                    // STEP 2: ROTATING SHIFT CONFIG
                    <motion.div
                        key="step2"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                    >
                        <button
                            onClick={() => setStep(1)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '800' }}
                        >
                            <ChevronLeft size={20} /> Volver atrás
                        </button>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                background: 'rgba(250, 204, 21, 0.1)', 
                                color: 'var(--accent-primary)', 
                                padding: '6px 16px', 
                                borderRadius: '100px', 
                                fontSize: '0.85rem', 
                                fontWeight: '900',
                                marginBottom: '1.5rem'
                            }}>
                                <Info size={16} /> Configuración de Turno Inicial
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '950', letterSpacing: '-0.02em', margin: 0 }}>¿Qué turno tienes la <span style={{ color: 'var(--accent-primary)' }}>Semana A</span>?</h2>
                            <p style={{ color: 'var(--text-muted)', fontWeight: '500', marginTop: '8px' }}>Elegiremos tu turno inicial y se alternará automáticamente cada lunes.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[
                                { id: 'mañana', label: 'Mañana', time: '06:00 - 15:00', icon: '☀️' },
                                { id: 'tarde', label: 'Tarde', time: '15:00 - 00:00', icon: '🌙' }
                            ].map(t => (
                                <motion.button
                                    key={t.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSaveProfile(t.id as ShiftType)}
                                    disabled={loading}
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-light)',
                                        padding: '2.5rem 1rem',
                                        borderRadius: '24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        boxShadow: 'var(--shadow-premium)'
                                    }}
                                >
                                    <span style={{ fontSize: '3rem' }}>{t.icon}</span>
                                    <span style={{ fontWeight: '950', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{t.label}</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: '100px' }}>{t.time}</span>
                                </motion.button>
                            ))}
                        </div>

                        <div style={{ 
                            background: 'var(--bg-secondary)', 
                            padding: '1.25rem', 
                            borderRadius: '20px', 
                            display: 'flex', 
                            gap: '12px', 
                            color: 'var(--text-secondary)',
                            marginTop: '1rem'
                        }}>
                            <Info size={40} style={{ opacity: 0.5 }} />
                            <p style={{ fontSize: '0.85rem', fontWeight: '500', margin: 0, lineHeight: '1.5' }}>
                                Si eliges Mañana para la Semana A, el sistema te asignará Tarde automáticamente para la Semana B cada vez que empiece una nueva semana en el calendario oficial de CodiaTax.
                            </p>
                        </div>

                        {loading && (
                            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
                                <p style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--accent-primary)' }}>Guardando configuración...</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ marginTop: 'auto', paddingTop: '3rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', opacity: 0.5 }}>CodiaTax Premium v1.3.1</p>
            </div>
        </div>
    );
};

export default ProfileSetup;
