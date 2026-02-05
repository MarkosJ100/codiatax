import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Scroll, Wallet, Wrench, PlaneLanding, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { format, es } from '../../utils/dateHelpers';
import Toast from '../Common/Toast';

// @ts-ignore
import logo from '../../assets/logo.jpg';

const MobileShell: React.FC = () => {
    const { logout, user } = useApp();
    const location = useLocation();
    const currentDate = format(new Date(), "dd 'de' MMMM, yyyy", { locale: es });

    return (
        <div className="container">
            {/* Header */}
            <header className="glass" style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                maxWidth: '480px', margin: '0 auto',
                padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid var(--border-light)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <motion.img
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        src={logo}
                        alt="Logo"
                        style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'contain', border: '1px solid var(--border-light)' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '-0.01em' }}>
                            Hola, {user?.name || 'Conductor'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                            {currentDate}
                        </span>
                    </div>
                </div>
                <button onClick={logout} className="btn-ghost" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Salir</span>
                    <LogOut size={18} />
                </button>
            </header>

            {/* Content with Page Transitions */}
            <main className="page-content" style={{ marginTop: '72px' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        style={{ width: '100%' }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Navigation */}
            <nav className="glass" style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
                display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                padding: '0.5rem 0.25rem',
                borderTop: '1px solid var(--border-light)',
                maxWidth: '480px', margin: '0 auto',
                paddingBottom: 'env(safe-area-inset-bottom, 0.75rem)'
            }}>
                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Home size={22} />
                    <span>Inicio</span>
                </NavLink>
                <NavLink to="/services" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <PlusCircle size={22} />
                    <span>Servicios</span>
                </NavLink>
                <NavLink to="/history" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Scroll size={22} />
                    <span>Histórico</span>
                </NavLink>
                <NavLink to="/expenses" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Wallet size={22} />
                    <span>Gastos</span>
                </NavLink>
                <NavLink to="/maintenance" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Wrench size={22} />
                    <span>Taller</span>
                </NavLink>
                <NavLink to="/airport" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <PlaneLanding size={22} />
                    <span>Aero</span>
                </NavLink>
            </nav>

            {/* Notifications */}
            <Toast />
        </div>
    );
};

export default MobileShell;

