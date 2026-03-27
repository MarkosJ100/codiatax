import React, { Suspense, lazy, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVehicle } from '../context/VehicleContext';
import { useServices } from '../context/ServiceContext';
import { useShifts } from '../context/ShiftContext';
import { useUI } from '../context/UIContext';
import { format, es, endOfWeek } from '../utils/dateHelpers';
import { calculateTotals } from '../utils/financeHelpers';
import { useMaintenance } from '../hooks/useMaintenance';
import { AlertTriangle, Calculator, ArrowRight, Settings, Sun, Moon, ChevronDown, TrendingUp, Calendar } from 'lucide-react';
import PDFExportButton from '../components/Common/PDFExportButton';
import MonthlySummaryCard from '../components/Dashboard/MonthlySummaryCard';
import FuelPricesWidget from '../components/Dashboard/FuelPricesWidget';
import SecuritySettings from '../components/Settings/SecuritySettings';
import DataSettings from '../components/Settings/DataSettings';
import BillingWidget from '../components/Dashboard/BillingWidget';
import { normalizeUsername, displayUsername } from '../utils/userHelpers';

const UnifiedChart = lazy(() => import('../components/Dashboard/UnifiedChart'));

const Home: React.FC = () => {
    const { user } = useAuth();
    const { vehicle, currentOdometer, mileageLogs } = useVehicle();
    const { services, expenses, annualConfig, updateAnnualConfig } = useServices();
    const { shiftStorage, getShiftForDate } = useShifts();
    const { theme, toggleTheme, showToast } = useUI();

    const [tempKm, setTempKm] = useState<string>('');
    const [analysisPeriod, setAnalysisPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
    const [showSettings, setShowSettings] = useState(false);

    const { maintenanceStatuses } = useMaintenance(vehicle, currentOdometer);
    const alerts = useMemo(() => {
        return (maintenanceStatuses || [])
            .filter((status) => status.remaining <= 1000)
            .map((status) => ({ name: status.name, remaining: status.remaining }));
    }, [maintenanceStatuses]);

    const today = useMemo(() => new Date(), []);

    const stats = useMemo(() => {
        return calculateTotals(services, expenses, mileageLogs, analysisPeriod);
    }, [services, expenses, mileageLogs, analysisPeriod]);

    const { grossIncome, totalRealExpenses, netIncomeReal, totalKms } = stats;

    const isRestingToday = (shiftStorage?.restDays || []).includes(format(today, 'yyyy-MM-dd'));
    const isAirportToday = (shiftStorage?.assignments || []).some(
        (assignment) => assignment.date === format(today, 'yyyy-MM-dd') && assignment.userId === normalizeUsername(user?.name || '')
    );

    const currentShift = useMemo(() => {
        if (!user) return null;
        return getShiftForDate(today);
    }, [getShiftForDate, today, user]);

    const isEndOfYear = today.getMonth() === 11 && today.getDate() === 31;
    const needsEndYearKm = isEndOfYear && annualConfig.yearEndKm === 0;

    const handleEndYearKm = (e: React.FormEvent) => {
        e.preventDefault();
        if (tempKm && !isNaN(parseInt(tempKm, 10))) {
            updateAnnualConfig({ yearEndKm: parseInt(tempKm, 10) });
            showToast('Kil�metros de cierre de a�o guardados.');
            setTempKm('');
        }
    };

    const isAirportWeek = useMemo(() => {
        try {
            if (!user || !shiftStorage?.assignments || !Array.isArray(shiftStorage.assignments)) return false;

            const todayStr = format(today, 'yyyy-MM-dd');
            const endOfWeekDate = endOfWeek(today, { locale: es });
            const endOfWeekStr = format(endOfWeekDate, 'yyyy-MM-dd');

            return shiftStorage.assignments.some((assignment) => {
                if (!assignment || !assignment.date) return false;
                return assignment.userId === normalizeUsername(user.name) && assignment.date >= todayStr && assignment.date <= endOfWeekStr;
            });
        } catch (err) {
            console.warn('Error calculating airport week alert:', err);
            return false;
        }
    }, [shiftStorage, user, today]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.15 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.25 } }
    };

    if (!user) return null;

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ paddingBottom: '100px' }}>
            <motion.div variants={itemVariants} style={{ marginBottom: '2rem', padding: '0 0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <div 
                            style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                background: 'var(--accent-soft)', 
                                padding: '4px 10px', 
                                borderRadius: '20px',
                                marginBottom: '0.4rem'
                            }}
                        >
                            <Calendar size={12} color="var(--accent-strong)" />
                            <span style={{ fontSize: '0.65rem', fontWeight: '850', color: 'var(--accent-strong)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Dashboard Central
                            </span>
                        </div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '950', letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>
                            Hola, {displayUsername(user.name)}
                        </h1>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleTheme}
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '18px',
                            border: '1px solid var(--border-light)',
                            background: 'var(--bg-card)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--shadow-premium)',
                            cursor: 'pointer'
                        }}
                    >
                        {theme === 'dark' ? <Moon size={20} color="var(--accent-primary)" /> : <Sun size={20} color="var(--warning)" />}
                    </motion.button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '650', letterSpacing: '-0.01em' }}>
                        {format(today, "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                    {user.isShared && currentShift && !isRestingToday && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-premium)' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '850', textTransform: 'uppercase' }}>
                                Turno {currentShift.type}
                            </span>
                        </div>
                    )}
                </div>

                {isAirportWeek && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass"
                        style={{
                            marginTop: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '18px',
                            border: '1px solid rgba(var(--accent-primary-rgb), 0.25)',
                            background: 'linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.12), rgba(var(--accent-primary-rgb), 0.04))',
                            boxShadow: 'var(--shadow-premium)'
                        }}
                    >
                        <AlertTriangle size={20} color="var(--accent-primary)" />
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: '750', letterSpacing: '-0.01em' }}>
                            Atento: tienes turno de aeropuerto esta semana.
                        </span>
                    </motion.div>
                )}
            </motion.div>

            <motion.div
                variants={itemVariants}
                className="glass"
                style={{
                    borderRadius: '28px',
                    padding: '1.75rem',
                    marginBottom: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-floating)',
                    background: 'var(--bg-card)'
                }}
            >
                {/* Visual Accent */}
                <div style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '180px',
                    height: '180px',
                    background: 'radial-gradient(circle, rgba(var(--accent-primary-rgb), 0.18) 0%, transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
                        <div>
                            <div 
                                style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '6px', 
                                    background: 'rgba(var(--success-rgb), 0.1)', 
                                    padding: '4px 10px', 
                                    borderRadius: '10px',
                                    marginBottom: '0.5rem'
                                }}
                            >
                                <TrendingUp size={12} color="var(--success)" />
                                <span style={{ fontSize: '0.65rem', fontWeight: '850', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Recaudaci�n Neta
                                </span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                                BALANCE DEL PERIODO
                            </div>
                        </div>
                        <div className="segmented-control" style={{ maxWidth: '200px', padding: '3px', borderRadius: '14px', background: 'var(--bg-secondary)' }}>
                            {(['day', 'week', 'month', 'year'] as const).map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setAnalysisPeriod(period)}
                                    className={analysisPeriod === period ? 'active' : ''}
                                    style={{ 
                                        padding: '6px 2px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: '800',
                                        borderRadius: '10px'
                                    }}
                                >
                                    {period === 'day' ? 'Hoy' : period === 'week' ? 'Sem' : period === 'month' ? 'Mes' : 'A�o'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2.25rem' }}>
                        <div style={{ 
                            fontSize: '4.2rem', 
                            fontWeight: '950', 
                            color: 'var(--text-primary)', 
                            letterSpacing: '-0.07em', 
                            lineHeight: 0.9,
                            display: 'flex',
                            alignItems: 'baseline'
                        }}>
                            {netIncomeReal.toFixed(0)}
                            <span style={{ fontSize: '1.5rem', marginLeft: '6px', fontWeight: '900', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>�</span>
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '8px',
                            padding: '1.25rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '24px',
                            border: '1px solid var(--border-light)'
                        }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '850', letterSpacing: '0.06em', marginBottom: '6px' }}>Bruto</div>
                            <div style={{ fontWeight: '950', fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{grossIncome.toFixed(0)}<small style={{ fontSize: '0.7em', fontWeight: '700', marginLeft: '1px', opacity: 0.5 }}>�</small></div>
                        </div>
                        <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '850', letterSpacing: '0.06em', marginBottom: '6px' }}>Gastos</div>
                            <div style={{ fontWeight: '950', fontSize: '1.1rem', color: 'var(--danger)', letterSpacing: '-0.02em' }}>{totalRealExpenses.toFixed(0)}<small style={{ fontSize: '0.7em', fontWeight: '700', marginLeft: '1px', opacity: 0.5 }}>�</small></div>
                        </div>
                        <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '850', letterSpacing: '0.06em', marginBottom: '6px' }}>Neto</div>
                            <div style={{ fontWeight: '950', fontSize: '1.1rem', color: 'var(--success)', letterSpacing: '-0.02em' }}>{netIncomeReal.toFixed(0)}<small style={{ fontSize: '0.7em', fontWeight: '700', marginLeft: '1px', opacity: 0.5 }}>�</small></div>
                        </div>
                        <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '850', letterSpacing: '0.06em', marginBottom: '6px' }}>KMs</div>
                            <div style={{ fontWeight: '950', fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{totalKms > 9999 ? (totalKms/1000).toFixed(1) + 'k' : totalKms.toFixed(0)}</div>
                        </div>
                    </div>

                    <BillingWidget />
                </div>
            </motion.div>

            {user.isShared && (
                <motion.div
                    variants={itemVariants}
                    className="glass"
                    style={{
                        marginBottom: '1.5rem',
                        padding: '18px 20px',
                        borderRadius: '24px',
                        background: isRestingToday ? 'rgba(var(--danger-rgb), 0.05)' : 'var(--bg-elevated)',
                        border: '1px solid var(--border-light)',
                        borderLeft: `5px solid ${isRestingToday ? 'var(--danger)' : 'var(--accent-primary)'}`,
                        boxShadow: 'var(--shadow-premium)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '850', letterSpacing: '0.08em', marginBottom: '4px' }}>
                                {isAirportToday ? 'Servicio Aeropuerto' : (isRestingToday ? 'D�a Libre' : 'Estado del Turno')}
                            </div>
                            <div style={{ fontWeight: '850', fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                {isRestingToday ? 'Fuera de Servicio' : (currentShift ? `${currentShift.weekLabel}` : 'Servicio Libre')}
                            </div>
                            {currentShift && !isRestingToday && (
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '650', marginTop: '2px' }}>
                                    De {currentShift.startTime} a {currentShift.endTime}
                                </div>
                            )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                background: isRestingToday ? 'rgba(var(--danger-rgb), 0.1)' : 'rgba(var(--success-rgb), 0.1)',
                                padding: '6px 12px',
                                borderRadius: '10px'
                            }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isRestingToday ? 'var(--danger)' : 'var(--success)' }}></div>
                                <span style={{ color: isRestingToday ? 'var(--danger)' : 'var(--success)', fontWeight: '900', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                    {isRestingToday ? 'Reposo' : 'Activo'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <motion.div variants={itemVariants} style={{ marginBottom: '2.5rem', display: 'grid', gap: '14px' }}>
                <Link to="/calculator" style={{ textDecoration: 'none' }}>
                    <div
                        className="card"
                        style={{
                            margin: 0,
                            padding: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            border: '1px solid var(--border-light)',
                            background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))',
                            boxShadow: 'var(--shadow-premium)'
                        }}
                    >
                        <div
                            style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 20px var(--accent-glow)'
                            }}
                        >
                            <Calculator size={26} color="#1c1917" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '2px', letterSpacing: '-0.03em' }}>Calculadora Tarifas</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '650' }}>Tasas oficiales actualizadas 2026</div>
                        </div>
                        <div style={{ padding: '8px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
                            <ArrowRight size={18} color="var(--text-muted)" />
                        </div>
                    </div>
                </Link>

                <div
                    onClick={() => setShowSettings(!showSettings)}
                    className="glass"
                    style={{
                        padding: '1.25rem',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        cursor: 'pointer',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        boxShadow: 'var(--shadow-premium)'
                    }}
                >
                    <div
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-light)'
                        }}
                    >
                        <Settings size={26} color="var(--text-muted)" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '2px', letterSpacing: '-0.03em' }}>Configuraci�n</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '650' }}>Seguridad, datos y exportaci�n avanzada</div>
                    </div>
                    <motion.div animate={{ rotate: showSettings ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={20} color="var(--text-muted)" />
                    </motion.div>
                </div>

                <motion.div
                    initial={false}
                    animate={{ height: showSettings ? 'auto' : 0, opacity: showSettings ? 1 : 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                >
                    <div style={{ display: 'grid', gap: '12px', padding: '4px 2px 14px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                            <PDFExportButton />
                        </div>
                        <div className="glass" style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-light)', background: 'var(--bg-elevated)' }}>
                            <SecuritySettings />
                        </div>
                        <div className="glass" style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-light)', background: 'var(--bg-elevated)' }}>
                            <DataSettings />
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {needsEndYearKm && (
                <motion.div variants={itemVariants} className="card" style={{ marginBottom: '2rem', backgroundColor: 'rgba(var(--warning-rgb), 0.08)', border: '2px dashed var(--warning)', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                        <AlertTriangle size={22} color="var(--warning)" />
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '900', letterSpacing: '-0.02em' }}>Cierre de a�o ({today.getFullYear()})</h3>
                    </div>
                    <p style={{ fontSize: '0.88rem', marginBottom: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: '600' }}>
                        Introduce los kil�metros finales marcados en el od�metro para completar el informe anual obligatorio.
                    </p>
                    <form onSubmit={handleEndYearKm} style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="number"
                            value={tempKm}
                            onChange={(e) => setTempKm(e.target.value)}
                            placeholder={currentOdometer.toString()}
                            style={{ 
                                flex: 1, 
                                height: '52px', 
                                borderRadius: '14px', 
                                border: '1px solid var(--border-light)', 
                                padding: '0 16px', 
                                background: 'var(--bg-input)', 
                                color: 'var(--text-primary)',
                                fontWeight: '700'
                            }}
                        />
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 24px', borderRadius: '14px', height: '52px' }}>Grabar KMs</button>
                    </form>
                </motion.div>
            )}

            {(alerts || []).length > 0 && (
                <motion.div variants={itemVariants} style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', padding: '0 0.25rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }}></div>
                        <h2 style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Alertas de veh�culo</h2>
                    </div>
                    <div style={{ display: 'grid', gap: '14px' }}>
                        {alerts.map((alert, idx) => (
                            <div
                                key={idx}
                                className="glass"
                                style={{
                                    padding: '1.25rem',
                                    borderRadius: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    border: '1px solid var(--border-light)',
                                    borderLeft: '5px solid var(--danger)',
                                    background: 'var(--bg-card)',
                                    boxShadow: 'var(--shadow-premium)'
                                }}
                            >
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '14px',
                                    background: 'rgba(var(--danger-rgb), 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid rgba(var(--danger-rgb), 0.1)'
                                }}>
                                    <AlertTriangle size={22} color="var(--danger)" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '2px', letterSpacing: '-0.02em' }}>{alert.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: '750' }}>Faltan {alert.remaining} km</div>
                                </div>
                                <Link to="/maintenance" style={{ 
                                    padding: '10px 18px', 
                                    borderRadius: '12px', 
                                    fontSize: '0.8rem', 
                                    fontWeight: '850', 
                                    background: 'var(--bg-secondary)', 
                                    textDecoration: 'none', 
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-light)',
                                    boxShadow: 'var(--shadow-premium)'
                                }}>
                                    Gestionar
                                </Link>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            <motion.div variants={itemVariants} style={{ display: 'grid', gap: '2.5rem' }}>
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                            <h2 style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>An�lisis Gr�fico</h2>
                        </div>
                        <Link to="/history" style={{ fontSize: '0.82rem', color: 'var(--accent-strong)', textDecoration: 'none', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Historial completo <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="card" style={{ margin: 0, padding: '1.5rem', borderRadius: '28px', border: '1px solid var(--border-light)' }}>
                        <Suspense fallback={<div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Cargando gráfico...</div>}>
                            <UnifiedChart />
                        </Suspense>
                    </div>
                </section>

                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', padding: '0 0.25rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                        <h2 style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Cierre Mensual</h2>
                    </div>
                    <MonthlySummaryCard />
                </section>

                <div style={{ marginTop: '1rem' }}>
                    <FuelPricesWidget />
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Home;



