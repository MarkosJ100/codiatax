import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { isSameDay, format, es } from '../utils/dateHelpers';
import { AlertTriangle } from 'lucide-react';
import PDFExportButton from '../components/Common/PDFExportButton';
import StatsDashboard from '../components/Dashboard/StatsDashboard';
import MileageWidget from '../components/Dashboard/MileageWidget';
import IncomeChart from '../components/Dashboard/IncomeChart';
import ExportMenu from '../components/Common/ExportMenu';
import SecuritySettings from '../components/Settings/SecuritySettings';

const Home: React.FC = () => {
    const {
        user, vehicle, services, expenses, currentOdometer,
        annualConfig, updateAnnualConfig, showToast,
        shiftStorage, getShiftForDate
    } = useApp();

    const [tempKm, setTempKm] = useState<string>('');

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

    // Calculate Today's Incomes
    const today = new Date();
    const dailyServices = services.filter(service => isSameDay(new Date(service.timestamp), today));
    const grossIncome = dailyServices.reduce((sum, service) => sum + service.amount, 0);

    // Calculate Today's Labor Expenses
    const dailyLaborExpenses = expenses
        .filter(e => e.type === 'labor' && isSameDay(new Date(e.timestamp), today))
        .reduce((sum, e) => sum + e.amount, 0);

    const netIncome = grossIncome - dailyLaborExpenses;

    const isRestingToday = (shiftStorage?.restDays || []).includes(format(today, 'yyyy-MM-dd'));
    const isAirportToday = (shiftStorage?.assignments || []).some(a => a.date === format(today, 'yyyy-MM-dd') && a.userId === user?.name);

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
                return a.userId === user.name && a.date >= todayStr && d <= nextWeekDate;
            });
        } catch (err) {
            console.warn("Error calculating airport week alert:", err);
            return false;
        }
    }, [shiftStorage, user, today]);

    if (!user) return null;

    return (
        <div style={{ paddingBottom: '80px' }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '2rem' }}
            >
                <h1 style={{ fontSize: '1.85rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    Hola, {user.name}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>
                    {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                </p>

                {user?.isShared && currentShift && !isRestingToday && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ marginTop: '8px', fontSize: '0.95rem', color: 'var(--accent-primary)', fontWeight: '600' }}
                    >
                        Esta semana tienes turno de{' '}
                        <span style={{ textTransform: 'uppercase', textDecoration: 'underline', textUnderlineOffset: '4px' }}>{currentShift.type}</span>
                    </motion.div>
                )}

                {isAirportWeek && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            marginTop: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'rgba(250, 204, 21, 0.12)',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: '1px solid rgba(250, 204, 21, 0.2)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <AlertTriangle size={18} color="var(--accent-primary)" />
                        <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: '700' }}>
                            ¡Atento! Tienes turno de aeropuerto esta semana.
                        </span>
                    </motion.div>
                )}
            </motion.div>

            <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
                Resumen del Día
            </motion.h2>

            {user?.isShared && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="card"
                    style={{
                        marginBottom: '1rem',
                        borderLeft: `4px solid ${isRestingToday ? 'var(--danger)' : 'var(--accent-primary)'}`,
                        opacity: isRestingToday ? 0.8 : 1,
                        background: isRestingToday ? 'rgba(244, 63, 94, 0.05)' : 'var(--bg-card)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.02em' }}>
                                {isAirportToday ? 'Turno Aeropuerto' : (isRestingToday ? 'Día de Descanso' : 'Turno de Trabajo')}
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '1.1rem', marginTop: '2px' }}>
                                {isRestingToday ? 'No Laborable' : (user?.isShared && currentShift ? `${currentShift.weekLabel} - ${currentShift.startTime} a ${currentShift.endTime}` : 'Servicio Libre')}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Estado</div>
                            <div style={{ color: isRestingToday ? 'var(--danger)' : 'var(--success)', fontWeight: '800', fontSize: '1rem' }}>
                                {isRestingToday ? 'Descansando' : 'En Servicio'}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {needsEndYearKm && (
                <div className="card" style={{ marginBottom: '1rem', backgroundColor: 'rgba(234, 179, 8, 0.15)', border: '2px solid var(--accent-primary)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>⚠️ Cierre de Año ({today.getFullYear()})</h3>
                    <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Introduce los kilómetros finales para el registro anual.</p>
                    <form onSubmit={handleEndYearKm} style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="number"
                            value={tempKm}
                            onChange={e => setTempKm(e.target.value)}
                            placeholder={currentOdometer.toString()}
                            style={{ flex: 1, height: '44px' }}
                        />
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 1rem' }}>Grabar</button>
                    </form>
                </div>
            )}

            {isBeginningOfYear && annualConfig.yearEndKm > 0 && (
                <div className="card" style={{ marginBottom: '1rem', border: '1px solid var(--accent-primary)', backgroundColor: 'var(--accent-glow)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Inicio de Año {today.getFullYear()}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{annualConfig.yearEndKm.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>km</span></div>
                </div>
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}
            >
                <PDFExportButton />
                <ExportMenu />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                <StatsDashboard />
            </motion.div>

            {/* Widgets */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                style={{ display: 'grid', gap: '1.25rem', marginBottom: '2rem' }}
            >
                <MileageWidget />
                <IncomeChart days={30} />
            </motion.div>

            {user?.role === 'employee' && (
                <div className="card" style={{ marginTop: '1rem', padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                        Finanzas del Asalariado
                    </h3>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Recaudación Bruta</span>
                        <span style={{ fontWeight: 'bold' }}>{grossIncome.toFixed(2)} €</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: 'var(--danger)' }}>
                        <span style={{ display: 'flex', alignItems: 'center' }}>(-) Gastos Laborales</span>
                        <span>{dailyLaborExpenses.toFixed(2)} €</span>
                    </div>

                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Recaudación Limpia</span>
                        <span style={{ fontWeight: 'bold', fontSize: '1.5rem', color: netIncome >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {netIncome.toFixed(2)} €
                        </span>
                    </div>
                </div>
            )}

            {/* Security Settings */}
            <SecuritySettings />
        </div>
    );
};

export default Home;
