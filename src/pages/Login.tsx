import React, { useState, useActionState } from 'react';
import { useApp } from '../context/AppContext';
import {
    User as UserIcon, ShieldCheck, CreditCard, ChevronLeft, ChevronRight,
    CheckCircle2
} from 'lucide-react';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    getDate, addMonths, subMonths, es
} from '../utils/dateHelpers';
import { User, UserRole, WorkMode, ShiftType } from '../types';

const Login: React.FC = () => {
    const context = useApp();
    const { login, shiftStorage, toggleAirportShift, toggleRestDay, checkShiftCollision, saveUserShiftConfig, showToast } = context;

    const [savedUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('codiatax_user');
        return saved && saved !== "undefined" && saved !== "null" ? JSON.parse(saved) : null;
    });

    const [role, setRole] = useState<UserRole>(savedUser?.role || 'employee');
    const [name, setName] = useState<string>(savedUser?.name || '');
    const [license, setLicense] = useState<string>(savedUser?.licenseNumber || '');
    const [workMode, setWorkMode] = useState<WorkMode>(savedUser?.workMode || (savedUser?.isShared ? 'rotating' : 'solo'));
    const [rememberMe, setRememberMe] = useState<boolean>(true);

    // Shift selection state
    const [shiftWeek, setShiftWeek] = useState<string>(savedUser?.shiftWeek || 'Semana A');
    const [shiftType, setShiftType] = useState<ShiftType>(savedUser?.shiftType || 'mañana');
    const [viewDate, setViewDate] = useState<Date>(new Date());

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(viewDate),
        end: endOfMonth(viewDate)
    });

    // React 19 Action to handle the configuration flow
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const actionType = formData.get('actionType') as string;

        if (actionType === 'step1') {
            const nameVal = name.trim();
            const licenseVal = license.trim();

            if (!nameVal) {
                showToast("Introduce tu nombre", "error");
                return { step: 1 };
            }
            if (!/^\d{3}$/.test(licenseVal)) {
                showToast("Licencia de 3 dígitos", "error");
                return { step: 1 };
            }

            let currentShiftType = shiftType;
            if (workMode === 'fixed') {
                currentShiftType = role === 'owner' ? 'mañana' : 'tarde';
                setShiftType(currentShiftType);
            }

            if (workMode === 'rotating') {
                return { step: 2 };
            } else {
                handleConfirm(currentShiftType);
                return { step: 1 }; // Success will trigger login which switches components
            }
        }

        if (actionType === 'confirm') {
            handleConfirm();
            return { step: 2 };
        }

        return prevState;
    }, { step: 1 });

    const handleConfirm = (override?: string | ShiftType) => {
        const isSharedMode = workMode !== 'solo';
        const overrideShiftType = (typeof override === 'string') ? override as ShiftType : null;
        const finalShiftType = overrideShiftType || shiftType;

        if (isSharedMode && workMode === 'rotating') {
            const collisionOwner = checkShiftCollision(shiftWeek, finalShiftType, name);
            if (collisionOwner) {
                return showToast(`EL turno ${shiftWeek} ${finalShiftType} ya lo tiene ${collisionOwner}`, "error");
            }
        }

        const userData: User = {
            name: name.trim(),
            role,
            licenseNumber: license,
            isShared: isSharedMode,
            workMode,
            shiftWeek,
            shiftType: finalShiftType,
            startTime: finalShiftType === 'mañana' ? '06:00' : '15:00',
            endTime: finalShiftType === 'mañana' ? '15:00' : '00:00',
            lastLogin: new Date().toISOString()
        };

        if (isSharedMode) {
            saveUserShiftConfig({ userName: name, shiftWeek, shiftType: finalShiftType, workMode });
        }

        login(userData, rememberMe);
    };

    const isAirportShift = (day: Date) => {
        return (shiftStorage.assignments || []).some(a => a.date === format(day, 'yyyy-MM-dd') && a.userId === name);
    };

    const isRestDay = (day: Date) => {
        return shiftStorage.restDays?.includes(format(day, 'yyyy-MM-dd'));
    };

    const isTakenByOther = (day: Date) => {
        return (shiftStorage.assignments || []).some(a => a.date === format(day, 'yyyy-MM-dd') && a.userId !== name);
    };

    const handleDayClick = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');

        if (isRestDay(day)) {
            toggleRestDay(dateStr);
            toggleAirportShift(dateStr, 'standard', name);
        } else if (isAirportShift(day)) {
            toggleAirportShift(dateStr, 'standard', name);
        } else {
            if (isTakenByOther(day)) {
                return showToast("Turno de aeropuerto ocupado por otro", "error");
            }
            if (workMode === 'solo') {
                toggleAirportShift(dateStr, 'standard', name);
            } else {
                toggleRestDay(dateStr);
            }
        }
    };

    return (
        <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--accent-primary)', fontWeight: '800' }}>CODIATAX</h1>
                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Gestión Unificada de Turnos</p>
            </div>

            <div className="card" style={{ padding: '1.5rem', flex: 1 }}>
                {state.step === 1 ? (
                    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <input type="hidden" name="actionType" value="step1" />
                        <h2 style={{ textAlign: 'center', fontSize: '1.2rem' }}>Configuración Inicial</h2>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" onClick={() => setRole('owner')} className={`btn ${role === 'owner' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1, border: '1px solid var(--border-color)' }}>
                                <ShieldCheck size={16} style={{ marginRight: '6px' }} /> Dueño
                            </button>
                            <button type="button" onClick={() => setRole('employee')} className={`btn ${role === 'employee' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1, border: '1px solid var(--border-color)' }}>
                                <UserIcon size={16} style={{ marginRight: '6px' }} /> Chófer
                            </button>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>Nombre</label>
                            <input
                                name="userName"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input"
                                placeholder="Tu nombre corto"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>Número de Licencia</label>
                            <div style={{ position: 'relative' }}>
                                <CreditCard size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.5 }} />
                                <input name="license" type="text" inputMode="numeric" value={license} onChange={e => setLicense(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="Ej: 123" style={{ paddingLeft: '40px' }} required />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Modalidad del Taxi</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(['solo', 'fixed', 'rotating'] as WorkMode[]).map((mode) => (
                                    <div
                                        key={mode}
                                        onClick={() => setWorkMode(mode)}
                                        style={{
                                            padding: '10px', borderRadius: '8px', border: workMode === mode ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                            backgroundColor: workMode === mode ? 'rgba(250, 204, 21, 0.1)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'
                                        }}
                                    >
                                        <div style={{ padding: '8px', borderRadius: '50%', background: 'var(--bg-secondary)' }}>
                                            {mode === 'solo' ? '🚗' : mode === 'fixed' ? '🤝' : '🔄'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                {mode === 'solo' ? 'Conductor Único' : mode === 'fixed' ? 'Propietario + Asalariado' : 'Dos Propietarios'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                                {mode === 'solo' ? 'Trabajo solo, sin turnos fijos.' : mode === 'fixed' ? 'Turnos fijos (Mañana / Tarde).' : 'Turnos rotativos semanales (A / B).'}
                                            </div>
                                        </div>
                                        {workMode === mode && <CheckCircle2 size={18} color="var(--accent-primary)" style={{ marginLeft: 'auto' }} />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                style={{ width: '16px', height: '16px' }}
                            />
                            <label htmlFor="rememberMe" style={{ fontSize: '0.9rem', cursor: 'pointer', opacity: 0.8 }}>
                                Recordar sesión y configuración
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ padding: '1rem' }} disabled={isPending}>
                            {isPending ? 'Procesando...' : (workMode === 'rotating' ? 'Siguiente' : 'Entrar')}
                        </button>
                    </form>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                            <button onClick={() => formAction(new FormData())} className="btn-ghost" style={{ padding: '8px' }}><ChevronLeft size={20} /></button>
                            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Tus Turnos</h2>
                        </div>

                        {workMode === 'rotating' && (
                            <div className="card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>Configura tu Rotación Semanal</div>
                                <p style={{ fontSize: '0.75rem', opacity: 0.7, textAlign: 'center', marginBottom: '12px' }}>
                                    Elige qué turno tendrás en la <strong>Semana A</strong>. La Semana B será el turno opuesto automáticamente.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <button onClick={() => setShiftType('mañana')} className={`btn ${shiftType === 'mañana' ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.8rem', height: '44px', border: '1px solid var(--border-color)' }}>
                                        Semana A: Mañana<br /><span style={{ fontSize: '0.65rem', opacity: 0.8 }}>(Semana B: Tarde)</span>
                                    </button>
                                    <button onClick={() => setShiftType('tarde')} className={`btn ${shiftType === 'tarde' ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.8rem', height: '44px', border: '1px solid var(--border-color)' }}>
                                        Semana A: Tarde<br /><span style={{ fontSize: '0.65rem', opacity: 0.8 }}>(Semana B: Mañana)</span>
                                    </button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                                    Esta semana es: {parseInt(format(new Date(), 'I')) % 2 !== 0 ? 'Semana A' : 'Semana B'}
                                </div>
                            </div>
                        )}

                        {workMode === 'fixed' && (
                            <div className="card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', marginBottom: '0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Turno Fijo Asignado</div>
                                <div style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                    {shiftType} (06:00 - 15:00)
                                </div>
                                <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>
                                    {role === 'owner' ? 'Como Propietario, tienes el turno de mañana.' : 'Como Asalariado, tienes el turno de tarde.'}
                                </p>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                                    <button onClick={() => setShiftType(shiftType === 'mañana' ? 'tarde' : 'mañana')} style={{ fontSize: '0.7rem', textDecoration: 'underline', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        Cambiar manualmente (si excepción)
                                    </button>
                                </div>
                            </div>
                        )}

                        {workMode === 'solo' && (
                            <div className="card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', marginBottom: '0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Gestión de Aeropuerto</div>
                                <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                    Selecciona abajo los días que harás servicios de aeropuerto.
                                </p>
                            </div>
                        )}

                        {workMode === 'rotating' && (
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="btn-ghost"><ChevronLeft size={18} /></button>
                                    <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{format(viewDate, 'MMMM yyyy', { locale: es })}</span>
                                    <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="btn-ghost"><ChevronRight size={18} /></button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 'bold' }}>{d}</div>)}
                                    {Array.from({ length: (startOfMonth(viewDate).getDay() + 6) % 7 }).map((_, i) => <div key={i} />)}
                                    {daysInMonth.map(day => {
                                        const isRest = isRestDay(day);
                                        const isAero = isAirportShift(day);
                                        const isOther = isTakenByOther(day);
                                        return (
                                            <div
                                                key={day.toISOString()}
                                                onClick={() => handleDayClick(day)}
                                                style={{
                                                    aspectRatio: '1',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    backgroundColor: isRest ? 'rgba(239, 68, 68, 0.2)' : (isAero ? 'rgba(16, 185, 129, 0.2)' : (isOther ? 'rgba(255,255,255,0.05)' : 'transparent')),
                                                    border: isRest ? '1px solid #ef4444' : (isAero ? '1px solid #10b981' : (isOther ? 'none' : '1px solid transparent')),
                                                    color: isOther ? 'rgba(255,255,255,0.2)' : 'inherit',
                                                    position: 'relative'
                                                }}
                                            >
                                                {getDate(day)}
                                                <div style={{ position: 'absolute', bottom: '2px', display: 'flex', gap: '2px' }}>
                                                    {isRest && <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>}
                                                    {isAero && <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <form action={formAction}>
                            <input type="hidden" name="actionType" value="confirm" />
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'auto', padding: '1rem' }} disabled={isPending}>
                                {isPending ? 'Confirmando...' : 'Confirmar y Entrar'}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.7rem', opacity: 0.4, marginTop: '1rem' }}>v1.2.0 - Unified Calendar Sync</p>
        </div>
    );
};

export default Login;
