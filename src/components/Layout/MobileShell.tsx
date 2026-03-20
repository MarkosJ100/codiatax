import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Scroll, Wallet, Wrench, PlaneLanding, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format, es } from '../../utils/dateHelpers';
import Toast from '../Common/Toast';

// @ts-ignore
import logo from '../../assets/logo.jpg';

const MobileShell: React.FC = () => {
    const { logout, user } = useAuth();
    const location = useLocation();
    const currentDate = format(new Date(), "dd 'de' MMMM, yyyy", { locale: es });

    return (
        <div className="container">
            {/* Header */}
            <header className="glass" style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                maxWidth: '480px', margin: '0 auto',
                padding: '0.9rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-light)',
                background: 'var(--bg-nav)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img
                        src={logo}
                        alt="Logo"
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '16px',
                            objectFit: 'contain',
                            border: '1px solid var(--border-light)',
                            background: 'white',
                            boxShadow: 'var(--shadow-premium)'
                        }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '800', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                            {user?.name || 'Conductor'}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '2px' }}>
                            {currentDate}
                        </span>
                    </div>
                </div>
                <button
                    onClick={logout}
                    style={{
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px',
                        background: 'rgba(0,0,0,0.04)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--text-secondary)'
                    }}
                >
                    <LogOut size={18} />
                </button>
            </header>

            {/* Content — CSS keyframe fade-in */}
            <main className="page-content" style={{ paddingTop: '82px', paddingBottom: '90px' }}>
                <div
                    key={location.pathname}
                    className="page-fade-in"
                    style={{ width: '100%' }}
                >
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="glass" style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
                display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                padding: '0.6rem 0.4rem',
                borderTop: '1px solid var(--border-light)',
                maxWidth: '480px', margin: '0 auto',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.6rem)',
                background: 'var(--bg-nav)',
                boxShadow: 'var(--shadow-floating)',
                backdropFilter: 'blur(12px)'
            }}>
                <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
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
                <NavLink to="/invoicing" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <FileText size={22} />
                    <span>Facturas</span>
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
