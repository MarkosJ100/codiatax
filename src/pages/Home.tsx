import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { isSameDay, format, es } from '../utils/dateHelpers';
import { calculateTotals, Period } from '../utils/financeHelpers';
import { AlertTriangle, Calculator, PlusCircle, Wallet, History, ArrowRight, Settings, Sun, Moon, ChevronDown } from 'lucide-react';
import PDFExportButton from '../components/Common/PDFExportButton';

import UnifiedChart from '../components/Dashboard/UnifiedChart';
import FuelPricesWidget from '../components/Dashboard/FuelPricesWidget';
import ExportMenu from '../components/Common/ExportMenu';
import SecuritySettings from '../components/Settings/SecuritySettings';

import DataSettings from '../components/Settings/DataSettings';
import BillingWidget from '../components/Dashboard/BillingWidget';
import { normalizeUsername, displayUsername } from '../utils/userHelpers';

const Home: React.FC = () => {
    const {
        user, vehicle, services, expenses, currentOdometer,
        annualConfig, updateAnnualConfig, showToast,
        shiftStorage, getShiftForDate, mileageLogs,
        theme, toggleTheme
    } = useApp();

    const [tempKm, setTempKm] = useState<string>('');
    const [period, setPeriod] = useState<Period>('day');
    const [showSettings, setShowSettings] = useState(false);

    // Check for maintenance alerts
    const alerts = useMemo(() => {
        return Object.entries(vehicle.maintenance)
            .map(([_, item]) => {
                const nextServiceKm = item.lastKm + item.interval;
                const remaining = nextServiceKm - currentOdometer;
                return { name: item.name, remaining };
            })
            .filter(item => item.remaining <= 1000);
    }, [vehicle, currentOdometer]);

    // Calculate Metrics using robust utility with selectable period
    const today = new Date();
    const {
        grossIncome,
        totalExpenses,
        netIncome,
        totalKms,
        pendingSubscriberBalance
    } = calculateTotals(services, expenses, mileageLogs, period, today);

    const isRestingToday = (shiftStorage?.restDays || []).includes(format(today, 'yyyy-MM-dd'));
    const isAirportToday = (shiftStorage?.assignments || []).some(a => a.date === format(today, 'yyyy-MM-dd') && a.userId === normalizeUsername(user?.name || ''));

    // Calculate shift safely
    const currentShift = useMemo(() => {
        if (!user) return null;
        return getShiftForDate(today);
    }, [getShiftForDate, today, user]);

    // Annual Odometer Prompt Logic
    const isEndOfYear = today.getMonth() === 11 && today.getDate() === 31;
    const isBeginningOfYear = today.getMonth() === 0 && today.getDate() <= 7;
    const needsEndYearKm = isEndOfYear && annualConfig.yearEndKm === 0;

    const handleEndYearKm = (e: React.FormEvent) => {
        e.preventDefault();
        if (tempKm && !isNaN(parseInt(tempKm))) {
            updateAnnualConfig({ yearEndKm: parseInt(tempKm) });
            showToast("Kilómetros de cierre de año guardados.");
            setTempKm('');
        }
    };

    // --- Shift Logic for Header (Defensive) ---
    const isAirportWeek = useMemo(() => {
        try {
            if (!user || !shiftStorage?.assignments || !Array.isArray(shiftStorage.assignments)) return false;

            const todayStr = format(today, 'yyyy-MM-dd');
            const nextWeekDate = new Date(today);
            nextWeekDate.setDate(today.getDate() + 6);

            return shiftStorage.assignments.some(a => {
                if (!a || !a.date) return false;
                const d = new Date(a.date);
                return a.userId === normalizeUsername(user.name) && a.date >= todayStr && d <= nextWeekDate;
            });
        } catch (err) {
            console.warn("Error calculating airport week alert:", err);
            return false;
        }
    }, [shiftStorage, user, today]);

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (!user) return null;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ paddingBottom: '100px' }}
        >
            {/* Header / Welcome Area */}
            <motion.div variants={itemVariants} style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Hola, {displayUsername(user.name)}
                    </h1>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleTheme}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--bg-card)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }}
                    >
                        {theme === 'dark' ? <Moon size={18} color="var(--accent-primary)" /> : <Sun size={18} color="var(--warning)" />}
                    </motion.button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
                        {format(today, "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                    {user?.isShared && currentShift && !isRestingToday && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '700', textTransform: 'uppercase' }}>
                            Turno {currentShift.type}
                        </span>
                    )}
                </div>

                {isAirportWeek && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass"
                        style={{
                            marginTop: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '16px',
                            border: '1px solid rgba(var(--accent-primary-rgb), 0.3)',
                            background: 'rgba(var(--accent-primary-rgb), 0.1)'
                        }}
                    >
                        <AlertTriangle size={18} color="var(--accent-primary)" />
                        <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: '700' }}>
                            ¡Atento! Tienes turno de aeropuerto esta semana.
                        </span>
                    </motion.div>
                )}
            </motion.div>

            {/* UNIFIED FINANCIAL OVERVIEW — Premium Card */}
            <motion.div
                variants={itemVariants}
                style={{
                    background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(var(--accent-primary-rgb), 0.08) 100%)',
                    borderRadius: '24px',
                    padding: '2rem',
                    marginBottom: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'var(--shadow-premium)'
                }}
            >
                {/* Decorative glow */}
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-20%',
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(var(--accent-primary-rgb), 0.15) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                    pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Period selector */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' }}>
                            Recaudación Limpia
                        </div>
                        <div style={{
                            display: 'flex',
                            background: 'rgba(var(--accent-primary-rgb), 0.08)',
                            borderRadius: '10px',
                            padding: '3px',
                            gap: '2px'
                        }}>
                            {(['day', 'week', 'month', 'year'] as Period[]).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    style={{
                                        padding: '5px 10px',
                                        borderRadius: '8px',
                                        fontSize: '0.65rem',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: period === p ? '#fff' : 'var(--text-muted)',
                                        background: period === p ? 'var(--accent-primary)' : 'transparent',
                                        fontWeight: period === p ? '700' : '500',
                                        transition: 'all 0.2s ease',
                                        letterSpacing: '0.02em'
                                    }}
                                >
                                    {p === 'day' ? 'Hoy' : p === 'week' ? 'Sem' : p === 'month' ? 'Mes' : 'Año'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Large net income */}
                    <div style={{ fontSize: '2.75rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '24px' }}>
                        {netIncome.toFixed(2)}<span style={{ fontSize: '1.5rem', marginLeft: '4px', opacity: 0.6, color: 'var(--text-muted)' }}>€</span>
                    </div>

                    {/* 4-stat grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '8px',
                        padding: '16px',
                        background: 'rgba(var(--accent-primary-rgb), 0.04)',
                        borderRadius: '16px',
                        border: '1px solid rgba(var(--accent-primary-rgb), 0.08)'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '6px' }}>Bruto</div>
                            <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--success)' }}>+{grossIncome.toFixed(0)}€</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '6px' }}>Gastos</div>
                            <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--danger)' }}>-{totalExpenses.toFixed(0)}€</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '6px' }}>Neto</div>
                            <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--accent-primary)' }}>{netIncome.toFixed(0)}€</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '6px' }}>Dist.</div>
                            <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)' }}>{totalKms.toLocaleString()} <span style={{ fontSize: '0.6rem', fontWeight: '400' }}>km</span>
                            </div>
                        </div>
                    </div>

                    <BillingWidget />
                </div>
            </motion.div>

            {/* Original Shared User Shift Card - Styled Premium */}
            {
                user?.isShared && (
                    <motion.div
                        variants={itemVariants}
                        className="glass"
                        style={{
                            marginBottom: '1.5rem',
                            padding: '16px',
                            borderRadius: '20px',
                            borderLeft: `4px solid ${isRestingToday ? 'var(--danger)' : 'var(--accent-primary)'}`,
                            opacity: isRestingToday ? 0.8 : 1,
                            background: isRestingToday ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.03)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                                    {isAirportToday ? 'Turno Aeropuerto' : (isRestingToday ? 'Día de Descanso' : 'Turno de Trabajo')}
                                </div>
                                <div style={{ fontWeight: '700', fontSize: '1rem', marginTop: '4px', color: 'var(--text-primary)' }}>
                                    {isRestingToday ? 'No Laborable' : (user?.isShared && currentShift ? `${currentShift.weekLabel} - ${currentShift.startTime} a ${currentShift.endTime}` : 'Servicio Libre')}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Estado</div>
                                <div style={{ color: isRestingToday ? 'var(--danger)' : 'var(--success)', fontWeight: '800', fontSize: '0.95rem' }}>
                                    {isRestingToday ? 'Descansando' : 'En Servicio'}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )
            }

            {/* Quick Actions */}
            <motion.div variants={itemVariants} style={{ marginBottom: '2.5rem', display: 'grid', gap: '12px' }}>
                {/* Calculator */}
                <Link to="/calculator" style={{ textDecoration: 'none' }}>
                    <div className="glass" style={{
                        padding: '1.25rem',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        border: '1px solid rgba(var(--accent-primary-rgb), 0.3)',
                        background: 'linear-gradient(90deg, rgba(var(--accent-primary-rgb), 0.1) 0%, rgba(var(--accent-primary-rgb), 0.02) 100%)',
                        boxShadow: '0 10px 30px rgba(var(--accent-primary-rgb), 0.1)'
                    }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: 'var(--accent-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(var(--accent-primary-rgb), 0.3)'
                        }}>
                            <Calculator size={24} color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '2px' }}>Calculadora de Tarifas</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Consulta los precios oficiales 2025</div>
                        </div>
                        <ArrowRight size={18} color="var(--text-muted)" />
                    </div>
                </Link>

                {/* Settings Access */}
                <div
                    onClick={() => setShowSettings(!showSettings)}
                    className="glass"
                    style={{
                        padding: '1.25rem',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        cursor: 'pointer',
                        border: '1px solid var(--glass-border)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '14px',
                        background: 'var(--bg-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Settings size={24} color="var(--text-muted)" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '2px' }}>Ajustes</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Exportar, seguridad y datos</div>
                    </div>
                    <motion.div animate={{ rotate: showSettings ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={18} color="var(--text-muted)" />
                    </motion.div>
                </div>

                {/* Expandable Settings Panel */}
                <motion.div
                    initial={false}
                    animate={{ height: showSettings ? 'auto' : 0, opacity: showSettings ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                >
                    <div style={{
                        display: 'grid',
                        gap: '12px',
                        paddingTop: '4px'
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px'
                        }}>
                            <PDFExportButton />
                            <ExportMenu />
                        </div>
                        <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                            <SecuritySettings />
                        </div>
                        <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                            <DataSettings />
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Conditional Alerts (End of Year / Beginning of Year) - Styled Faithful */}
            {
                needsEndYearKm && (
                    <motion.div variants={itemVariants} className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '2px solid var(--accent-primary)', borderRadius: '20px' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--accent-primary)', fontWeight: '800' }}>⚠️ Cierre de Año ({today.getFullYear()})</h3>
                        <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Introduce los kilómetros finales para el registro anual.</p>
                        <form onSubmit={handleEndYearKm} style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="number"
                                value={tempKm}
                                onChange={e => setTempKm(e.target.value)}
                                placeholder={currentOdometer.toString()}
                                style={{ flex: 1, height: '44px', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '0 12px', background: 'var(--bg-body)', color: 'var(--text-primary)' }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 20px', borderRadius: '12px' }}>Grabar</button>
                        </form>
                    </motion.div>
                )
            }

            {
                isBeginningOfYear && annualConfig.yearEndKm > 0 && (
                    <motion.div variants={itemVariants} className="glass" style={{ marginBottom: '1.5rem', border: '1px solid var(--accent-primary)', padding: '16px', borderRadius: '20px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Inicio de Año {today.getFullYear()}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>{annualConfig.yearEndKm.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>km</span></div>
                    </motion.div>
                )
            }

            {/* Maintenance Alerts - Styled Premium Notifications */}
            {
                alerts.length > 0 && (
                    <motion.div variants={itemVariants} style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alertas de Vehículo</h2>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {alerts.map((alert, idx) => (
                                <div key={idx} className="glass" style={{
                                    padding: '12px 16px',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    borderLeft: '4px solid var(--danger)'
                                }}>
                                    <AlertTriangle size={20} color="var(--danger)" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{alert.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Faltan {alert.remaining} km</div>
                                    </div>
                                    <Link to="/maintenance" className="btn-ghost" style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(255,255,255,0.05)', textDecoration: 'none', color: 'var(--text-primary)' }}>Gestionar</Link>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )
            }

            {/* Main Content Sections */}
            <motion.div variants={itemVariants} style={{ display: 'grid', gap: '2rem' }}>
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Análisis</h2>
                        <Link to="/history" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Ver historial <ArrowRight size={14} />
                        </Link>
                    </div>
                    <UnifiedChart />
                </section>



                <FuelPricesWidget />

            </motion.div>


        </motion.div >
    );
};

export default Home;
